import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { setting, Prisma } from "@prisma/client";
import { TelegramService } from "../telegram/telegram.service";
import { CustomLoggerService } from "../logger/logger.service";

@Injectable()
export class SettingService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService
  ) {
    this.intializeTable();
  }

  async getSetting(
    userWhereUniqueInput: Prisma.settingWhereUniqueInput
  ): Promise<setting | null> {
    return this.prisma.setting.findUnique({
      where: userWhereUniqueInput
    });
  }

  async getSettings(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.settingWhereUniqueInput;
    where?: Prisma.settingWhereInput;
    orderBy?: Prisma.settingOrderByWithRelationInput;
  }): Promise<setting[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.setting.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy
    });
  }

  async createSetting(data: Prisma.settingCreateInput): Promise<setting> {
    return this.prisma.setting.create({
      data
    });
  }

  async updateSetting(params: {
    where: Prisma.settingWhereUniqueInput;
    data: Prisma.settingUpdateInput;
  }): Promise<setting> {
    const { where, data } = params;
    return this.prisma.setting.update({
      data,
      where
    });
  }

  async deleteSetting(where: Prisma.settingWhereUniqueInput): Promise<setting> {
    return this.prisma.setting.delete({
      where
    });
  }

  async intializeTable() {
    // CHAT_ID
    // CHANGELOG
    // COMMAND TO CHANGE SETTINGS
  }
}
