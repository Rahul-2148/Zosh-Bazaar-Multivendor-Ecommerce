import UserService from "../services/user.service.js";
import { Address } from "../../../models/address.model.js";
import { User } from "../../../models/user.model.js";

export const getUserProfileByJwt = async (req, res) => {
  try {
    const user = await req.user;
    if (!user) {
      return res.status(401).json({
        message: "User not authenticated",
        error: true,
        success: false,
      });
    }

    const userObj = user.toObject ? user.toObject() : user;
    return res.status(200).json({
      ...userObj,
      user: userObj,
      error: false,
      success: true,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const getUserByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        error: true,
        success: false,
      });
    }

    const userObj = user.toObject ? user.toObject() : user;
    return res.status(200).json({
      ...userObj,
      user: userObj,
      error: false,
      success: true,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const getUserAddresses = async (req, res) => {
  try {
    const user = await req.user;
    const directAddresses = await Address.find({ user: user._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    // Ensure at least one address is marked default if addresses exist
    if (directAddresses.length > 0 && !directAddresses.some((a) => a.isDefault)) {
      directAddresses[0].isDefault = true;
      await Address.findByIdAndUpdate(directAddresses[0]._id, { isDefault: true });
    }

    return res.status(200).json({
      success: true,
      error: false,
      addresses: directAddresses,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = await req.user;
    const existingCount = await Address.countDocuments({ user: user._id });

    const shouldBeDefault = Boolean(req.body.isDefault || existingCount === 0);

    if (shouldBeDefault) {
      await Address.updateMany({ user: user._id }, { $set: { isDefault: false } });
    }

    const address = await Address.create({
      ...req.body,
      isDefault: shouldBeDefault,
      user: user._id,
    });

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { addresses: address._id },
    });

    return res.status(201).json({
      success: true,
      error: false,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const updateAddress = async (req, res) => {
  try {
    const user = await req.user;
    const { addressId } = req.params;

    if (req.body.isDefault) {
      await Address.updateMany(
        { user: user._id, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      );
    }

    const updated = await Address.findOneAndUpdate(
      { _id: addressId, user: user._id },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Address not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "Address updated successfully",
      address: updated,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await req.user;
    const { addressId } = req.params;

    const target = await Address.findOne({ _id: addressId, user: user._id });
    if (!target) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Address not found or unauthorized",
      });
    }

    await Address.updateMany({ user: user._id }, { $set: { isDefault: false } });
    target.isDefault = true;
    await target.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "Default delivery address updated",
      address: target,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await req.user;
    const { addressId } = req.params;

    const deleted = await Address.findOneAndDelete({ _id: addressId, user: user._id });
    await User.findByIdAndUpdate(user._id, {
      $pull: { addresses: addressId },
    });

    // If deleted address was default, make the newest remaining address default
    if (deleted?.isDefault) {
      const remaining = await Address.findOne({ user: user._id }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "Address deleted successfully",
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await req.user;
    const { fullName, mobile } = req.body;
    const updated = await User.findByIdAndUpdate(
      user._id,
      { fullName, mobile },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      error: false,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const reverseGeocodeLocation = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    let resolved = null;

    // 1. OpenStreetMap Nominatim with compliant User-Agent
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "ZoshBazaarEcommerceApp/1.0 (contact@zoshbazaar.com)",
            "Accept": "application/json",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
          const city = addr.city || addr.town || addr.county || addr.state_district || "Bengaluru";
          const state = addr.state || "Karnataka";
          const locality =
            addr.neighbourhood ||
            addr.suburb ||
            addr.quarter ||
            addr.residential ||
            addr.road ||
            addr.town ||
            city;

          if (pin.length === 6) {
            resolved = {
              pincode: pin,
              city,
              state,
              locality,
              formattedAddress: `${locality}, ${city}, ${state} - ${pin}`,
            };
          }
        }
      }
    } catch {
      // Continue to Tier 2
    }

    // 2. BigDataCloud Reverse Geocoding fallback
    if (!resolved) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          const pin = (data.postcode || "").replace(/\D/g, "").slice(0, 6);
          const city = data.city || data.principalSubdivision || "Bengaluru";
          const state = data.principalSubdivision || "Karnataka";
          const locality = data.locality || city;

          if (pin.length === 6) {
            resolved = {
              pincode: pin,
              city,
              state,
              locality,
              formattedAddress: `${locality}, ${city}, ${state} - ${pin}`,
            };
          }
        }
      } catch {
        // Continue to Tier 3
      }
    }

    // 3. Enrich locality if generic
    if (resolved?.pincode && (!resolved.locality || resolved.locality === resolved.city)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const poRes = await fetch(`https://api.postalpincode.in/pincode/${resolved.pincode}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (poRes.ok) {
          const poData = await poRes.json();
          if (Array.isArray(poData) && poData[0]?.Status === "Success" && poData[0]?.PostOffice?.length > 0) {
            const po = poData[0].PostOffice[0];
            resolved.locality = po.Name || resolved.locality;
            resolved.city = po.District || resolved.city;
            resolved.state = po.State || resolved.state;
            resolved.formattedAddress = `${resolved.locality}, ${resolved.city}, ${resolved.state} - ${resolved.pincode}`;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!resolved) {
      resolved = {
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560100",
        locality: "Konappana Agrahara",
        formattedAddress: "Konappana Agrahara, Bengaluru, Karnataka - 560100",
      };
    }

    return res.status(200).json({
      success: true,
      ...resolved,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

const handleErrors = (err, res) => {
  return res.status(400).json({
    message: err.message || "An error occurred",
    error: true,
    success: false,
  });
};

