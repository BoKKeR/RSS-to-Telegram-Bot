import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { setting, Prisma } from "@prisma/client";
import { CustomLoggerService } from "../logger/logger.service";
import { delay, packageVersion } from "src/util/config";
import { getLogger } from "src/winston";

const winston = getLogger();

@Injectable()
export class SettingService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService
  ) {
    this.logger.setContext("SettingService");
    this.settingsChangelog();
  }

  async getSetting(
    userWhereUniqueInput: Prisma.settingWhereUniqueInput
  ): Promise<setting | null> {
    return this.prisma.setting.findUnique({
      where: userWhereUniqueInput
    });
  }

  async getSettingByChatId(chatId: number): Promise<setting | null> {
    return this.prisma.setting.findUnique({
      where: { chat_id: chatId }
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

  async settingsChangelog() {
    const chatSettings = await this.getSettings({});
    for (const chatSetting of chatSettings) {
      if (chatSetting.last_version !== packageVersion) {
        if (chatSetting.show_changelog) {
          // send changelog
        }
        chatSetting.last_version = packageVersion;
      }
    }
  }

  async intializeTable(chatId: number) {
    const chatSetting = await this.getSettingByChatId(chatId);
    winston.debug("INITIALIZE SETTINGS");

    if (!chatSetting) {
      winston.debug("settings not found");
      return await this.createSetting({
        chat_id: chatId,
        show_changelog: true,
        last_version: packageVersion,
        delay: delay
      });
    }

    // CHAT_ID
    // CHANGELOG
  }
}
