import fs from "node:fs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import escapeHTML from "escape-html";
import { channel } from "node:diagnostics_channel";
import { quicksort } from "./sort.mjs";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));
const prisma = new PrismaClient();

var current_channel = 1;
var current_message = 0;
var name = "akema";

const template = fs.readFileSync("./template.html", "utf-8");
const template_main_msg = fs.readFileSync("./main_message.html", "utf8");
const template_thread_msg = fs.readFileSync("./thread_message.html", "utf-8");

app.get("/", async (request, response) => {
  var all_main_msg = await prisma.msg.findMany({
    where: {
      channel: current_channel,
      thread: 0
    }
  });

  var all_thread_msg = await prisma.msg.findMany({
    where: {
      channel: current_channel,
      message: current_message
    }
  });

  
  const main_msgs = quicksort(0, all_main_msg.length - 1, all_main_msg).map( (msg) => 
    template_main_msg.replace(
      "<!-- member -->",
      msg.name
    ).replace(
      "<!-- sentTime -->",
      msg.sentTime.toLocaleString()
    ).replace(
      "<!-- text -->",
      msg.text
    ).replace(
      "<!-- stamp -->",
      () => {
        var stamp_spans = "";
        var stamp_exitst = false;
        for (let i = 0; i < 32; i++) {
          if (msg.stamps[i] > 0) {
            stamp_spans += `<span class="stamp"><img class="stamp_img" src="./images/stamp${i}"/> ${img.stamps[i]}</span>`;
            stamp_exitst = true;
          }
        }
        if (stamp_exitst) {
          stamp_spans += `<button class="add_stamp">+</button>`;
        }
        return stamp_spans;
      }
    ).replace(
      "<!-- reply -->",
      () => {
        if (msg.reply > 0) {
          return `${msg.reply}件の返信`;
        } else {
          return "";
        }
      }
    )
  ).join("");
  
  all_thread_msg = quicksort(0, all_thread_msg.length - 1, all_thread_msg);
  var thread_msgs = template_main_msg.replace(
    "<!-- member -->",
    all_thread_msg[0].name
  ).replace(
    "<!-- sentTime -->",
    all_thread_msg[0].sentTime.toLocaleString()
  ).replace(
    "<!-- text -->",
    all_thread_msg[0].text
  ).replace(
    "<!-- stamp -->",
    () => {
      var stamp_spans = "";
      var stamp_exitst = false;
      for (let i = 0; i < 32; i++) {
        if (all_thread_msg[0].stamps[i] > 0) {
          stamp_spans += `<span class="stamp"><img class="stamp_img" src="./images/stamp${i}"/> ${img.stamps[i]}</span>`;
          stamp_exitst = true;
        }
      }
      if (stamp_exitst) {
        stamp_spans += `<button class="add_stamp">+</button>`;
      }
      return stamp_spans;
    }
  );
  all_thread_msg.splice(0, 1);
  thread_msgs += all_thread_msg.map( (msg) =>
    template_thread_msg.replace(
      "<!-- member -->",
      msg.name
    ).replace(
      "<!-- sentTime -->",
      msg.sentTime.toLocaleString()
    ).replace(
      "<!-- text -->",
      msg.text
    ).replace(
      "<!-- stamp -->",
      () => {
        var stamp_spans = "";
        var stamp_exitst = false;
        for (let i = 0; i < 32; i++) {
          if (msg.stamps[i] > 0) {
            stamp_spans += `<span class="stamp"><img class="stamp_img" src="./images/stamp${i}"/> ${img.stamps[i]}</span>`;
            stamp_exitst = true;
          }
        }
        if (stamp_exitst) {
          stamp_spans += `<button class="add_stamp">+</button>`;
        }
        return stamp_spans;
      }
    )
  ).join("");

  const html = template.replace(
    "<!-- main_msgs -->",
    main_msgs
  ).replace(
    "<!-- thread_msgs -->",
    thread_msgs
  );
  
  response.send(html);
});

app.post("/send_main", async (request, response) => {
  const message_num = (await prisma.msg.findMany({
    where: {
      channel: current_channel
    }
  })).length;

  await prisma.msg.create({
    data: {
      channel: current_channel,
      message: message_num,
      thread: 0,
      name: name,
      text: request.body.message,
      stamps: [],
      reply: 0,
    },
  });
  
  response.redirect("/");
});

app.post("/send_thread", async (request, response) => {
  const message_num = (await prisma.msg.findMany({
    where: {
      channel: current_channel,
      message: current_message
    }
  })).length;

  await prisma.msg.create({
    data: {
      channel: current_channel,
      message: current_message,
      thread: message_num,
      name: name,
      text: request.body.message,
      stamps: [],
      reply: 0,
    },
  });
  await prisma.msg.updateMany({
    where: {
      AND: [
        {channel: current_channel},
        {message: current_message},
        {thread: 0}
      ]
    },
    data: {
      reply: message_num
    }
  });
  response.redirect("/");
});

app.listen(3000);
