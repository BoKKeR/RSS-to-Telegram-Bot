import { RssService } from "./rss.service";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma.service";
import * as Parser from "rss-parser";
import axios from "axios";
import { TelegramService } from "../telegram/telegram.service";
import { CustomLoggerService } from "../logger/logger.service";

jest.mock("axios");
jest.mock("rss-parser", () => {
  return jest.fn().mockImplementation(() => {
    return {
      parseString: jest.fn().mockReturnValue({
        items: [
          {
            title: "Thank God for subtitles",
            link: "https://www.reddit.com/r/funny/6/",
            pubDate: "2022-03-19T16:52:39.000Z",
            author: "/u/Pathosx",
            content:
              '<table> <tr><td> <a href="https://www.reddit.com/r/funny/comments/thzedr/thank_god_for_subtitles/"> <img src="https://preview.redd.it/1fii6o9kedo81.jpg?width=640&amp;crop=smart&amp;auto=webp&amp;s=fffb11fe517869ab9d655d7828b2df79d9c87f6a" alt="Thank God for subtitles" title="Thank God for subtitles" /> </a> </td><td> &#32; submitted by &#32; <a href="https://www.reddit.com/user/Pathosx"> /u/Pathosx </a> <br/> <span><a href="https://i.redd.it/1fii6o9kedo81.jpg">[link]</a></span> &#32; <span><a href="https://www.reddit.com/r/funny/comments/thzedr/thank_god_for_subtitles/">[comments]</a></span> </td></tr></table>',
            contentSnippet:
              "submitted by    /u/Pathosx  \n [link]   [comments]",
            id: "t3_thzedr",
            isoDate: "2022-03-19T16:52:39.000Z"
          },
          {
            title: "People on r/WouldYouRather finding loopholes",
            link: "https://www.reddit.com/r/funny/5/",
            pubDate: "2022-03-19T16:47:06.000Z",
            author: "/u/Bledalot",
            content:
              '<table> <tr><td> <a href="https://www.reddit.com/r/funny/comments/thza2s/people_on_rwouldyourather_finding_loopholes/"> <img src="https://preview.redd.it/q1lzzr7hcdo81.png?width=640&amp;crop=smart&amp;auto=webp&amp;s=c97b562f9258bb65eaf866f3572b5e1a7cc0538f" alt="People on r/WouldYouRather finding loopholes" title="People on r/WouldYouRather finding loopholes" /> </a> </td><td> &#32; submitted by &#32; <a href="https://www.reddit.com/user/Bledalot"> /u/Bledalot </a> <br/> <span><a href="https://i.redd.it/q1lzzr7hcdo81.png">[link]</a></span> &#32; <span><a href="https://www.reddit.com/r/funny/comments/thza2s/people_on_rwouldyourather_finding_loopholes/">[comments]</a></span> </td></tr></table>',
            contentSnippet:
              "submitted by    /u/Bledalot  \n [link]   [comments]",
            id: "t3_thza2s",
            isoDate: "2022-03-19T16:47:06.000Z"
          },
          {
            title:
              "Staring right into the face of death while stuffing your face",
            link: "https://www.reddit.com/r/funny/4/",
            pubDate: "2022-03-19T16:45:34.000Z",
            author: "/u/SligPants",
            content:
              '<table> <tr><td> <a href="https://www.reddit.com/r/funny/comments/thz8uq/staring_right_into_the_face_of_death_while/"> <img src="https://external-preview.redd.it/he3YKPJx36xgAdueyKmxEc1AqHy9ozrB06bNpFo5oT4.png?width=640&amp;crop=smart&amp;auto=webp&amp;s=cbca955efc838c8589f6ccde0a64072a7aea41f8" alt="Staring right into the face of death while stuffing your face" title="Staring right into the face of death while stuffing your face" /> </a> </td><td> &#32; submitted by &#32; <a href="https://www.reddit.com/user/SligPants"> /u/SligPants </a> <br/> <span><a href="https://v.redd.it/4o1p0s1addo81">[link]</a></span> &#32; <span><a href="https://www.reddit.com/r/funny/comments/thz8uq/staring_right_into_the_face_of_death_while/">[comments]</a></span> </td></tr></table>',
            contentSnippet:
              "submitted by    /u/SligPants  \n [link]   [comments]",
            id: "t3_thz8uq",
            isoDate: "2022-03-19T16:45:34.000Z"
          },
          {
            title: "...and you thought smoking at the pump was risky stuff 😂",
            link: "https://www.reddit.com/r/funny/3/",
            pubDate: "2022-03-19T16:44:13.000Z",
            author: "/u/iBrake4NoReason",
            content:
              '<table> <tr><td> <a href="https://www.reddit.com/r/funny/comments/thz7ry/and_you_thought_smoking_at_the_pump_was_risky/"> <img src="https://preview.redd.it/wbpu2pr2ddo81.jpg?width=640&amp;crop=smart&amp;auto=webp&amp;s=9cd112090fdbdc55f76b6ea3c13957bc5325f3a3" alt="...and you thought smoking at the pump was risky stuff 😂" title="...and you thought smoking at the pump was risky stuff 😂" /> </a> </td><td> &#32; submitted by &#32; <a href="https://www.reddit.com/user/iBrake4NoReason"> /u/iBrake4NoReason </a> <br/> <span><a href="https://i.redd.it/wbpu2pr2ddo81.jpg">[link]</a></span> &#32; <span><a href="https://www.reddit.com/r/funny/comments/thz7ry/and_you_thought_smoking_at_the_pump_was_risky/">[comments]</a></span> </td></tr></table>',
            contentSnippet:
              "submitted by    /u/iBrake4NoReason  \n [link]   [comments]",
            id: "t3_thz7ry",
            isoDate: "2022-03-19T16:44:13.000Z"
          },
          {
            title: "Cops in Alaska are in on the joke.",
            link: "https://www.reddit.com/r/funny/2/",
            pubDate: "2022-03-19T16:43:07.000Z",
            author: "/u/MulletCamaro",
            content:
              '<table> <tr><td> <a href="https://www.reddit.com/r/funny/comments/thz6y8/cops_in_alaska_are_in_on_the_joke/"> <img src="https://external-preview.redd.it/bQ4gjVr-82SFV6I02raBZlN3eqDIRto5PlRSlAI2Ldc.jpg?width=640&amp;crop=smart&amp;auto=webp&amp;s=3b13080c14506349f5c5d5e7f3c64733cf7d0d95" alt="Cops in Alaska are in on the joke." title="Cops in Alaska are in on the joke." /> </a> </td><td> &#32; submitted by &#32; <a href="https://www.reddit.com/user/MulletCamaro"> /u/MulletCamaro </a> <br/> <span><a href="https://i.imgur.com/xTsSyjc.jpg">[link]</a></span> &#32; <span><a href="https://www.reddit.com/r/funny/comments/thz6y8/cops_in_alaska_are_in_on_the_joke/">[comments]</a></span> </td></tr></table>',
            contentSnippet:
              "submitted by    /u/MulletCamaro  \n [link]   [comments]",
            id: "t3_thz6y8",
            isoDate: "2022-03-19T16:43:07.000Z"
          },
          {
            title: "Look out, Norway!",
            link: "https://www.reddit.com/r/funny/1/",
            pubDate: "2022-03-19T16:38:34.000Z",
            author: "/u/ajbenson",
            content:
              '<table> <tr><td> <a href="https://www.reddit.com/r/funny/comments/thz3dh/look_out_norway/"> <img src="https://preview.redd.it/sfjja9g2cdo81.jpg?width=640&amp;crop=smart&amp;auto=webp&amp;s=dda207df102e416baa20ea76f69ff347dcfe39e6" alt="Look out, Norway!" title="Look out, Norway!" /> </a> </td><td> &#32; submitted by &#32; <a href="https://www.reddit.com/user/ajbenson"> /u/ajbenson </a> <br/> <span><a href="https://i.redd.it/sfjja9g2cdo81.jpg">[link]</a></span> &#32; <span><a href="https://www.reddit.com/r/funny/comments/thz3dh/look_out_norway/">[comments]</a></span> </td></tr></table>',
            contentSnippet:
              "submitted by    /u/ajbenson  \n [link]   [comments]",
            id: "t3_thz3dh",
            isoDate: "2022-03-19T16:38:34.000Z"
          }
        ]
      })
    };
  });
});

describe("RssService", () => {
  let service: RssService;
  let prisma: PrismaService;
  let telegramService: TelegramService;
  let loggerService: CustomLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RssService,
        PrismaService,
        {
          provide: TelegramService,
          useValue: {
            sendRss: jest.fn()
          }
        },
        {
          provide: CustomLoggerService,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            verbose: jest.fn(),
            debug: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<RssService>(RssService);
    prisma = module.get<PrismaService>(PrismaService);
    telegramService = module.get<TelegramService>(TelegramService);
    loggerService = module.get<CustomLoggerService>(CustomLoggerService);

    jest.clearAllMocks();
  });

  describe("handleInterval", () => {
    it("should update and send 3 posts", async () => {
      const db_result = [
        {
          link: "idk",
          name: "test",
          last: "https://www.reddit.com/r/funny/3/"
        }
      ];

      // need to do this as I cant hoist any variables on the top of the file
      const mockFeed = await new Parser().parseString("");

      prisma.rss.findMany = jest.fn().mockReturnValue(db_result);
      prisma.rss.update = jest.fn();

      // @ts-ignore
      axios.get.mockResolvedValue(db_result);

      jest.spyOn(telegramService, "sendRss");
      jest.spyOn(axios, "get");
      jest.spyOn(service, "handleInterval");
      jest.spyOn(service, "updateFeed");

      await service.handleInterval();

      expect(telegramService.sendRss).toBeCalledTimes(3);
      expect(axios.get).toBeCalledTimes(1);
      expect(axios.get).toBeCalledWith(db_result[0].link);
      expect(telegramService.sendRss).not.toBeCalledWith(db_result[0].last);

      expect(service.updateFeed).toBeCalledWith({
        where: { name: db_result[0].name },
        data: { last: mockFeed.items[0].link }
      });
    });

    it("should update and send 5 posts", async () => {
      const db_result = [
        {
          link: "idk",
          name: "test",
          last: "https://www.reddit.com/r/funny/1/"
        }
      ];
      // need to do this as I cant hoist any variables on the top of the file
      const mockFeed = await new Parser().parseString("");

      prisma.rss.findMany = jest.fn().mockReturnValue(db_result);
      prisma.rss.update = jest.fn();

      // @ts-ignore
      axios.get.mockResolvedValue(db_result);

      jest.spyOn(telegramService, "sendRss");
      jest.spyOn(axios, "get");
      jest.spyOn(service, "handleInterval");
      jest.spyOn(service, "updateFeed");

      await service.handleInterval();
      expect(telegramService.sendRss).toBeCalledTimes(5);
      expect(axios.get).toBeCalledWith(db_result[0].link);

      expect(service.updateFeed).toBeCalledWith({
        where: { name: db_result[0].name },
        data: { last: mockFeed.items[0].link }
      });
    });

    it("empty database", async () => {
      const db_result = [];

      prisma.rss.findMany = jest.fn().mockReturnValue(db_result);
      prisma.rss.update = jest.fn();

      // @ts-ignore
      axios.get.mockResolvedValue(db_result);

      const parser = new Parser();
      jest.spyOn(telegramService, "sendRss");
      jest.spyOn(service, "handleInterval");
      jest.spyOn(service, "updateFeed");
      jest.spyOn(parser, "parseString");
      jest.spyOn(axios, "get");

      await service.handleInterval();

      expect(telegramService.sendRss).toBeCalledTimes(0);
      expect(axios.get).toBeCalledTimes(0);
      expect(service.updateFeed).toBeCalledTimes(0);
      expect(parser.parseString).toBeCalledTimes(0);
    });

    it("no new posts, should not call", async () => {
      const db_result = [
        {
          link: "idk",
          name: "test",
          last: "https://www.reddit.com/r/funny/6/"
        }
      ];

      prisma.rss.findMany = jest.fn().mockReturnValue(db_result);
      prisma.rss.update = jest.fn();

      // @ts-ignore
      axios.get.mockResolvedValue(db_result);

      jest.spyOn(axios, "get");
      jest.spyOn(service, "handleInterval");
      jest.spyOn(service, "updateFeed");
      jest.spyOn(telegramService, "sendRss");

      await service.handleInterval();

      expect(axios.get).toBeCalledWith(db_result[0].link);
      expect(service.updateFeed).toBeCalledTimes(0);
    });

    it("new posts, but database post cant be found within them", async () => {
      const db_result = [
        {
          link: "idk",
          name: "test",
          last: "https://www.reddit.com/r/funny/10/"
        }
      ];
      // need to do this as I cant hoist any variables on the top of the file
      const mockFeed = await new Parser().parseString("");

      prisma.rss.findMany = jest.fn().mockReturnValue(db_result);
      prisma.rss.update = jest.fn();

      // @ts-ignore
      axios.get.mockResolvedValue(db_result);

      jest.spyOn(axios, "get");
      jest.spyOn(service, "handleInterval");
      jest.spyOn(service, "updateFeed");
      jest.spyOn(telegramService, "sendRss");

      await service.handleInterval();

      expect(telegramService.sendRss).toBeCalledTimes(6);
      expect(axios.get).toBeCalledWith(db_result[0].link);

      expect(service.updateFeed).toBeCalledWith({
        where: { name: db_result[0].name },
        data: { last: mockFeed.items[0].link }
      });
    });

    it("update 2 different hosts and send 3 posts each", async () => {
      const db_result = [
        {
          link: "idk",
          name: "test",
          last: "https://www.reddit.com/r/funny/3/"
        },
        {
          link: "idk",
          name: "test",
          last: "https://www.reddit.com/r/funny/3/"
        }
      ];
      // need to do this as I cant hoist any variables on the top of the file
      const mockFeed = await new Parser().parseString("");

      prisma.rss.findMany = jest.fn().mockReturnValue(db_result);
      prisma.rss.update = jest.fn();

      // @ts-ignore
      axios.get.mockResolvedValue(db_result);

      jest.spyOn(axios, "get");
      jest.spyOn(service, "handleInterval");
      jest.spyOn(service, "updateFeed");

      await service.handleInterval();

      expect(axios.get).toBeCalledTimes(2);
      expect(axios.get).toBeCalledWith(db_result[0].link);

      expect(service.updateFeed).toBeCalledWith({
        where: { name: db_result[0].name },
        data: { last: mockFeed.items[0].link }
      });
      expect(service.updateFeed).toBeCalledWith({
        where: { name: db_result[1].name },
        data: { last: mockFeed.items[0].link }
      });
    });
  });
});
