import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import { AvailabilityStatus, HubStatus, UserRole, UserStatus, VehicleType, ZoneStatus } from "../../generated/prisma/enums";

export const seedSystemAdmin = async () => {
  try {
    const isAdminExist = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (isAdminExist) {
      console.log("System Admin already exists. Skipping Admin Seed.");
      return;
    }

    const name = config.admin_name;
    const email = config.admin_email;
    const password = config.admin_password;

    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Admin Name, Email or Password missing in Env File!"
      );
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("System Admin Seeded successfully:", admin.email);
  } catch (error) {
    console.log("Error Seeding Admin:", error);
    try {
      await prisma.user.delete({
        where: { email: config.admin_email },
      });
    } catch (cleanupErr) {
    }
  }
};

export const seedTesterCustomer = async () => {
  try {
    const isCustomerExist = await prisma.user.findUnique({
      where: {
        email: config.tester_customer_email,
      },
    });

    if (isCustomerExist) {
      console.log("Tester Customer already exists. Skipping Customer Seed.");
      return;
    }

    const name = config.tester_customer_name;
    const email = config.tester_customer_email;
    const password = config.tester_customer_password;

    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Tester Customer Credentials missing in Env File!"
      );
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

    const customer = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("Tester Customer Seeded successfully:", customer.email);
  } catch (error) {
    console.log("Error Seeding Customer:", error);
    try {
      await prisma.user.delete({
        where: { email: config.tester_customer_email },
      });
    } catch (cleanupErr) {}
  }
};

export const seedTesterCourier = async () => {
  try {
    const isCourierExist = await prisma.user.findUnique({
      where: {
        email: config.tester_courier_email,
      },
    });

    if (isCourierExist) {
      console.log("Tester Courier already exists. Skipping Courier Seed.");
      return;
    }

    const name = config.tester_courier_name;
    const email = config.tester_courier_email;
    const password = config.tester_courier_password;

    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Tester Courier Credentials missing in Env File!"
      );
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

    const courier = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.COURIER,
        emailVerified: true,
        status: UserStatus.ACTIVE,
        courierProfile: {
          create: {
            vehicleType: VehicleType.MOTORCYCLE,
            vehicleNumber: "DHK-METRO-HA-5522",
            licenseNumber: "BRTA-DHK-88542",
            availabilityStatus: AvailabilityStatus.AVAILABLE,
            currentLatitude: 23.8103,
            currentLongitude: 90.4125,
          },
        },
      },
      include: {
        courierProfile: true,
      },
    });

    console.log("Tester Courier & Profile Seeded successfully:", courier.email);
  } catch (error) {
    console.log("Error Seeding Courier:", error);
    try {
      await prisma.user.delete({
        where: { email: config.tester_courier_email },
      });
    } catch (cleanupErr) {}
  }
};

export const seedDefaultHubs = async () => {
  try {
    const defaultHubs = [
      {
        name: "Dhaka Central Hub",
        code: "DHK-01",
        address: "Tejgaon Industrial Area, Dhaka 1208",
        city: "Dhaka",
        district: "Dhaka",
        phone: "+88028888001",
      },
      {
        name: "Chattogram Port Hub",
        code: "CTG-01",
        address: "Agrabad Commercial Area, Chattogram 4100",
        city: "Chattogram",
        district: "Chattogram",
        phone: "+88031720001",
      },
    ];

    for (const hubData of defaultHubs) {
      const isHubExist = await prisma.hub.findUnique({
        where: { code: hubData.code },
      });

      if (!isHubExist) {
        await prisma.hub.create({
          data: {
            ...hubData,
            status: HubStatus.ACTIVE,
          },
        });
        console.log(`Hub [${hubData.code}] Seeded.`);
      }
    }
  } catch (error) {
    console.log("Error Seeding Hubs:", error);
  }
};

export const seedDefaultZones = async () => {
  try {
    const defaultZones = [
      { name: "Dhaka Central", code: "DHAKA-CENTRAL", city: "Dhaka" },
      { name: "Chattogram Central", code: "CHATTOGRAM-CENTRAL", city: "Chattogram" },
    ];

    for (const zoneData of defaultZones) {
      const isZoneExist = await prisma.zone.findUnique({
        where: { code: zoneData.code },
      });

      if (!isZoneExist) {
        await prisma.zone.create({
          data: {
            ...zoneData,
            status: ZoneStatus.ACTIVE,
          },
        });
        console.log(` one [${zoneData.code}] Seeded.`);
      }
    }
  } catch (error) {
    console.log("Error Seeding Zones:", error);
  }
};

export const runMasterSeeder = async () => {
  console.log("Running Database Master Seed...");
  await seedSystemAdmin();
  await seedTesterCustomer();
  await seedTesterCourier();
  await seedDefaultHubs();
  await seedDefaultZones();
  console.log("Master Seeding successfully executed!");
};