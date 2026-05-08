import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { computeSharedSecret, encryptMessage, decryptMessage, stringToPoint } from "../lib/ecc.js";
import { decryptUserFields } from "./auth.controller.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password -eccPrivateKey");

    // Decrypt user information
    const decryptedUsers = users.map(user => {
      const userData = decryptUserFields(user);
      return {
        ...userData,
        eccPublicKey: user.eccPublicKey,
      };
    });

    res.status(200).json(decryptedUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    const currentUser = await User.findById(myId);
    const chatPartner = await User.findById(userToChatId);

    const decryptedMessages = messages.map(msg => {
      let decryptedText = "";

      if (msg.isEncrypted && msg.encryptedText) {
        try {
          const myPrivateKey = BigInt(currentUser.eccPrivateKey);
          const otherPublicKey = stringToPoint(chatPartner.eccPublicKey);
          const sharedSecret = computeSharedSecret(myPrivateKey, otherPublicKey);
          decryptedText = decryptMessage(msg.encryptedText, sharedSecret);
        } catch (decryptError) {
          console.log("Error decrypting message:", decryptError.message);
          decryptedText = "[Decryption failed]";
        }
      }

      return {
        ...msg._doc,
        text: decryptedText,
      };
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Get sender (current user) and receiver for ECC encryption
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    let encryptedText = null;

    if (text) {
      if (!sender.eccPrivateKey || !receiver.eccPublicKey) {
        return res.status(400).json({ error: "Unable to encrypt message because one of the users has not completed key setup." });
      }

      try {
        const senderPrivateKey = BigInt(sender.eccPrivateKey);
        const receiverPublicKey = stringToPoint(receiver.eccPublicKey);
        const sharedSecret = computeSharedSecret(senderPrivateKey, receiverPublicKey);
        encryptedText = encryptMessage(text, sharedSecret);
      } catch (encryptError) {
        console.log("Error encrypting message:", encryptError.message);
        return res.status(500).json({ error: "Failed to encrypt message." });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      encryptedText,
      image: imageUrl,
      isEncrypted: !!encryptedText,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    let responseText = "";
    if (encryptedText) {
      try {
        const senderPrivateKey = BigInt(sender.eccPrivateKey);
        const receiverPublicKey = stringToPoint(receiver.eccPublicKey);
        const sharedSecret = computeSharedSecret(senderPrivateKey, receiverPublicKey);
        responseText = decryptMessage(encryptedText, sharedSecret);
      } catch (decryptError) {
        console.log("Error decrypting message for response:", decryptError.message);
        responseText = "[Decryption failed]";
      }
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage._doc,
        text: responseText,
      });
    }

    res.status(201).json({
      ...newMessage._doc,
      text: responseText,
    });
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
