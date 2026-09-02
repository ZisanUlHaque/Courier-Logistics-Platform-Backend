import bcrypt from "bcryptjs";
import { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import config from "../../config";

const updateProfile = async (
  userId: string,
  data: { name?: string; phone?: string; profileImage?: string },
) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  return prisma.user.update({
    where: { id: userId },
    data,
    omit: { password: true },
  });
};

const uploadProfieImage = async (buffer: Buffer, userId: string) => {
  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "auto" }, (error, result) => {
          if (error) {
            return reject(error);
          }

          if (!result) {
            return reject(
              new AppError(
                httpStatus.BAD_GATEWAY,
                "Upload failed: Result is undefined",
              ),
            );
          }
          resolve(result);
        })
        .end(buffer);
    },
  );

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profileImage: cloudinaryResult.secure_url,
    },
    omit: {
      password: true,
    },
  });

  return updatedUser;
};

export const UserService = { updateProfile, uploadProfieImage };
