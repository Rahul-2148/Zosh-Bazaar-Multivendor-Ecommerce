import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";

export type LocationSource =
  | "DEFAULT_SAVED"
  | "SELECTED_SAVED"
  | "EXPLICIT_GPS"
  | "MANUAL_PINCODE"
  | "GUEST_DEFAULT";

export interface IDeliveryLocationContext {
  source: LocationSource;
  selectedAddressId?: string;
  addressId?: string;
  pincode: string;
  locality: string;
  city: string;
  state: string;
  formattedLabel: string;
  headerPrimary: string;
  headerSecondary: string;
  addressType?: "HOME" | "WORK" | "OTHER";
  isDefault?: boolean;
  recipientName?: string;
}

export interface LocationState {
  activeLocation: IDeliveryLocationContext;
  isDetectingGps: boolean;
  gpsError: string | null;
  serviceabilityStatus: {
    pincode: string;
    serviceable: boolean;
    city?: string;
    message?: string;
  } | null;
}

// Initial fallback for unauthenticated guest session
const getInitialGuestLocation = (): IDeliveryLocationContext => {
  try {
    const storedPin = localStorage.getItem("zosh_delivery_pincode") || "";
    const storedLabel = localStorage.getItem("zosh_delivery_label") || "";
    const storedLocality = localStorage.getItem("zosh_delivery_locality") || "";
    const storedCity = localStorage.getItem("zosh_delivery_city") || "";

    const isStale =
      storedLocality.includes("India Standard Coverage") ||
      storedLabel.includes("India Standard Coverage") ||
      storedCity.includes("India Standard Coverage") ||
      storedLocality.includes("Postal Code") ||
      storedLocality.includes("Area") && !storedCity;

    if (isStale) {
      localStorage.removeItem("zosh_delivery_pincode");
      localStorage.removeItem("zosh_delivery_label");
      localStorage.removeItem("zosh_delivery_locality");
      localStorage.removeItem("zosh_delivery_city");
    } else if (storedPin && storedPin.length === 6) {
      const loc = storedLocality || storedCity || "Bengaluru";
      return {
        source: "MANUAL_PINCODE",
        pincode: storedPin,
        locality: loc,
        city: storedCity || "Bengaluru",
        state: "",
        formattedLabel: storedLabel || `${loc} ${storedPin}`,
        headerPrimary: "Deliver to",
        headerSecondary: `${loc} ${storedPin}`,
      };
    }
  } catch {
    // ignore
  }

  return {
    source: "GUEST_DEFAULT",
    pincode: "",
    locality: "",
    city: "",
    state: "",
    formattedLabel: "Select delivery destination",
    headerPrimary: "Deliver to",
    headerSecondary: "Select Location",
  };
};

const initialState: LocationState = {
  activeLocation: getInitialGuestLocation(),
  isDetectingGps: false,
  gpsError: null,
  serviceabilityStatus: null,
};

/**
 * Priority Resolution Helper (Flipkart/Amazon Standard)
 * - Authenticated with default address: Header displays default address
 * - Authenticated with explicitly selected saved address: Header displays selected address
 * - Explicit GPS: Only if user clicked "Use current location"
 * - Never silently replaces default address with detected GPS
 */
export const buildLocationFromAddress = (
  addr: any,
  source: "DEFAULT_SAVED" | "SELECTED_SAVED"
): IDeliveryLocationContext => {
  const firstName = addr.name?.trim()?.split(" ")[0] || "User";
  const loc = addr.locality || addr.city || "";
  const pin = String(addr.pincode || "");

  return {
    source,
    selectedAddressId: addr._id,
    pincode: pin,
    locality: addr.locality || "",
    city: addr.city || "",
    state: addr.state || "",
    formattedLabel: `${addr.address ? `${addr.address}, ` : ""}${loc}, ${addr.city} ${pin}`.trim(),
    headerPrimary: `Deliver to ${firstName}`,
    headerSecondary: `${loc ? `${loc} ` : ""}${pin}`.trim(),
    addressType: addr.addressType || "HOME",
    isDefault: Boolean(addr.isDefault),
    recipientName: addr.name,
  };
};

/**
 * Async Thunk: Detect precise GPS and reverse-geocode to a human-readable locality.
 * Calls backend /user/location/reverse-geocode?lat=...&lng=... with IP fallback
 */
export const detectCurrentGpsLocation = createAsyncThunk(
  "location/detectCurrentGpsLocation",
  async (_, { rejectWithValue }) => {
    const resolveCoords = async (latitude: number, longitude: number): Promise<IDeliveryLocationContext> => {
      const res = await Api.get(
        `/user/location/reverse-geocode?lat=${latitude}&lng=${longitude}`
      );

      if (res.data?.pincode) {
        const pin = String(res.data.pincode);
        const locality = res.data.locality || res.data.city || "Current Area";
        const city = res.data.city || "Bengaluru";
        const state = res.data.state || "Karnataka";
        const formatted = `${locality}${city && city !== locality ? `, ${city}` : ""}`;

        localStorage.setItem("zosh_delivery_pincode", pin);
        localStorage.setItem("zosh_delivery_locality", locality);
        localStorage.setItem("zosh_delivery_city", city);
        localStorage.setItem("zosh_delivery_label", `${formatted} ${pin}`);

        return {
          source: "EXPLICIT_GPS",
          pincode: pin,
          locality,
          city,
          state,
          formattedLabel: `${formatted} ${pin}`,
          headerPrimary: "Deliver to",
          headerSecondary: `${locality} ${pin}`,
        };
      }
      throw new Error("Could not derive postal code from coordinates.");
    };

    const resolveIpLocation = async (): Promise<IDeliveryLocationContext> => {
      try {
        const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client");
        if (res.ok) {
          const data = await res.json();
          const pin = (data.postcode || "").replace(/\D/g, "").slice(0, 6) || "560100";
          const city = data.city || data.principalSubdivision || "Bengaluru";
          const locality = data.locality && data.locality !== city ? data.locality : (pin === "560100" ? "Konappana Agrahara" : city);
          const state = data.principalSubdivision || "Karnataka";
          const formatted = `${locality}${city && city !== locality ? `, ${city}` : ""}`;

          localStorage.setItem("zosh_delivery_pincode", pin);
          localStorage.setItem("zosh_delivery_locality", locality);
          localStorage.setItem("zosh_delivery_city", city);
          localStorage.setItem("zosh_delivery_label", `${formatted} ${pin}`);

          return {
            source: "EXPLICIT_GPS",
            pincode: pin,
            locality,
            city,
            state,
            formattedLabel: `${formatted} ${pin}`,
            headerPrimary: "Deliver to",
            headerSecondary: `${locality} ${pin}`,
          };
        }
      } catch {
        // ignore
      }
      throw new Error("Unable to determine location.");
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      try {
        return await resolveIpLocation();
      } catch {
        return rejectWithValue("Geolocation is not supported by your device.");
      }
    }

    return new Promise<IDeliveryLocationContext>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const loc = await resolveCoords(latitude, longitude);
            resolve(loc);
          } catch {
            try {
              const fallbackLoc = await resolveIpLocation();
              resolve(fallbackLoc);
            } catch (err: any) {
              reject(rejectWithValue(err?.message || "Failed to reverse-geocode coordinates."));
            }
          }
        },
        async () => {
          // If browser GPS permission denied, seamlessly fallback to IP geolocation
          try {
            const fallbackLoc = await resolveIpLocation();
            resolve(fallbackLoc);
          } catch {
            reject(rejectWithValue("Location permission denied. Please enter your pincode manually."));
          }
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  }
);

/**
 * Async Thunk: Verify 6-digit postal code against logistics serviceability.
 */
export const verifyPincodeServiceability = createAsyncThunk(
  "location/verifyPincodeServiceability",
  async (pincode: string, { rejectWithValue }) => {
    try {
      const res = await Api.get(`/logistics/serviceability?pincode=${pincode}`);
      return {
        pincode,
        serviceable: Boolean(res.data?.serviceable),
        city: res.data?.city,
        locality: res.data?.locality,
        state: res.data?.state,
        message: res.data?.message,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to check delivery serviceability."
      );
    }
  }
);

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    /**
     * User clicks on a saved address in selector.
     */
    selectSavedAddress: (state, action: PayloadAction<any>) => {
      const addr = action.payload;
      const isDefault = Boolean(addr.isDefault);
      state.activeLocation = buildLocationFromAddress(
        addr,
        isDefault ? "DEFAULT_SAVED" : "SELECTED_SAVED"
      );
      state.gpsError = null;

      try {
        localStorage.setItem("zosh_delivery_pincode", String(addr.pincode));
        localStorage.setItem("zosh_delivery_locality", addr.locality || "");
        localStorage.setItem("zosh_delivery_city", addr.city || "");
        localStorage.setItem("zosh_delivery_label", state.activeLocation.formattedLabel);
      } catch {
        // ignore
      }
    },

    /**
     * User enters manual 6-digit postal code.
     */
    applyManualPincode: (
      state,
      action: PayloadAction<{ pincode: string; city?: string; locality?: string }>
    ) => {
      const { pincode, city, locality } = action.payload;
      const loc = locality || city || "Area";
      state.activeLocation = {
        source: "MANUAL_PINCODE",
        pincode,
        locality: loc,
        city: city || "",
        state: "",
        formattedLabel: `${loc} ${pincode}`,
        headerPrimary: "Deliver to",
        headerSecondary: `${loc} ${pincode}`,
      };
      state.gpsError = null;

      try {
        localStorage.setItem("zosh_delivery_pincode", pincode);
        localStorage.setItem("zosh_delivery_locality", loc);
        localStorage.setItem("zosh_delivery_city", city || "");
        localStorage.setItem("zosh_delivery_label", `${loc} ${pincode}`);
      } catch {
        // ignore
      }
    },

    /**
     * Synchronizes user's saved addresses from backend (UserSlice) into the Location engine.
     * Enforces the Location Priority Rule without overwriting explicitly chosen addresses.
     */
    syncWithSavedAddresses: (state, action: PayloadAction<any[]>) => {
      const addresses = action.payload;
      if (!addresses || addresses.length === 0) return;

      // 1. If currently on a selected saved address that still exists, keep it
      if (state.activeLocation.source === "SELECTED_SAVED" && state.activeLocation.selectedAddressId) {
        const stillExists = addresses.find(
          (a) => a._id === state.activeLocation.selectedAddressId
        );
        if (stillExists) {
          state.activeLocation = buildLocationFromAddress(
            stillExists,
            stillExists.isDefault ? "DEFAULT_SAVED" : "SELECTED_SAVED"
          );
          return;
        }
      }

      // 2. If user explicitly used GPS in this session, retain user's explicit choice
      if (state.activeLocation.source === "EXPLICIT_GPS") {
        return;
      }

      // 3. Otherwise, set to default address (or first address)
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        state.activeLocation = buildLocationFromAddress(defaultAddr, "DEFAULT_SAVED");
        try {
          localStorage.setItem("zosh_delivery_pincode", String(defaultAddr.pincode));
          localStorage.setItem("zosh_delivery_locality", defaultAddr.locality || "");
          localStorage.setItem("zosh_delivery_city", defaultAddr.city || "");
          localStorage.setItem("zosh_delivery_label", state.activeLocation.formattedLabel);
        } catch {
          // ignore
        }
      }
    },

    /**
     * Clear error state
     */
    clearLocationError: (state) => {
      state.gpsError = null;
    },

    /**
     * Reset on user logout
     */
    resetLocationOnLogout: (state) => {
      state.activeLocation = getInitialGuestLocation();
      state.gpsError = null;
      state.serviceabilityStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GPS Detection
      .addCase(detectCurrentGpsLocation.pending, (state) => {
        state.isDetectingGps = true;
        state.gpsError = null;
      })
      .addCase(detectCurrentGpsLocation.fulfilled, (state, action) => {
        state.isDetectingGps = false;
        state.activeLocation = action.payload;
        state.gpsError = null;
      })
      .addCase(detectCurrentGpsLocation.rejected, (state, action) => {
        state.isDetectingGps = false;
        state.gpsError = (action.payload as string) || action.error.message || "Failed to detect location";
      })
      // Serviceability Verification
      .addCase(verifyPincodeServiceability.fulfilled, (state, action) => {
        state.serviceabilityStatus = action.payload;
      })
      .addCase(verifyPincodeServiceability.rejected, (state) => {
        state.serviceabilityStatus = null;
      });
  },
});

export const {
  selectSavedAddress,
  applyManualPincode,
  syncWithSavedAddresses,
  clearLocationError,
  resetLocationOnLogout,
} = locationSlice.actions;

export default locationSlice.reducer;
