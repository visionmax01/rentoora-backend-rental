import jwt from 'jsonwebtoken';
import cloudinary from 'cloudinary';
import User from '../models/UserModel';

export const updateClient = async (req, res) => {
  const { accountId } = req.params;
  const { dateOfBirth, name, email, phoneNo, province, district, municipality } = req.body;

  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    // Verify and decode the token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the existing client by accountId
    const existingClient = await User.findOne({ accountId });

    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if a new citizenship image was uploaded
    const newCitizenshipImage = req.files?.citizenshipImage?.[0]?.path;

    if (newCitizenshipImage && existingClient.citizenshipImagePath) {
      // Extract the public ID from the current citizenship image path
      const publicId = existingClient.citizenshipImagePath.split('/citizenshipImage/')[1].split('.')[0];
      
      console.log("Attempting to delete old citizenship image with public ID:", publicId);

      // Delete the old image from Cloudinary
      const result = await cloudinary.v2.uploader.destroy(`ClientDocuments/citizenshipImage/${publicId}`);

      // Log the response from Cloudinary to see if the deletion was successful
      console.log("Cloudinary deletion result:", result);

      // Check Cloudinary response to see if the image was successfully deleted
      if (result.result === 'ok') {
        console.log("Old citizenship image deleted successfully from Cloudinary.");
      } else {
        console.error("Failed to delete old citizenship image from Cloudinary:", result.result);
      }
    }

    // Update the citizenship image path or retain the old one
    const citizenshipImagePath = newCitizenshipImage || existingClient.citizenshipImagePath;

    // Update client details
    existingClient.dateOfBirth = dateOfBirth;
    existingClient.name = name;
    existingClient.email = email;
    existingClient.phoneNo = phoneNo;
    existingClient.province = province;
    existingClient.district = district;
    existingClient.municipality = municipality;
    existingClient.citizenshipImagePath = citizenshipImagePath;

    await existingClient.save();

    res.status(200).json({ message: "Client updated successfully", updatedClient: existingClient });
  } catch (error) {
    console.error("Error updating client details:", error);
    res.status(500).json({ message: "Error updating client details", error: error.message });
  }
};
