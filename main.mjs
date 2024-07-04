import fs from "node:fs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import escapeHTML from "escape-html";
import { channel } from "node:diagnostics_channel";

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
  const all_main_msg = await prisma.msg.findMany({
    where: {
      channel: current_channel,
      thread: 0
    }
  });

  const all_thread_msg = await prisma.msg.findMany({
    where: {
      channel: current_channel,
      message: current_message
    }
  });

  const main_msgs = all_main_msg.map( (msg) => 
    template_main_msg.replace(
      "<!-- member -->",
      msg.name
    ).replace(
      "<!-- sentTime -->",
      msg.sentTime
    ).replace(
      "<!-- text -->",
      msg.text
    ).replace(
      "<!-- stamp -->",
      () => {
        stamp_spans = "";
        stamp_exitst = false;
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
      msg.reply
    )
  ).join("");
  
  var thread_msgs = template_main_msg.replace(
    "<!-- member -->",
    all_thread_msg[0].name
  ).replace(
    "<!-- sentTime -->",
    all_thread_msg[0].sentTime
  ).replace(
    "<!-- text -->",
    all_thread_msg[0].text
  ).replace(
    "<!-- stamp -->",
    () => {
      stamp_spans = "";
      stamp_exitst = false;
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
  thread_msgs += all_thread_msg.map( (msg) =>
    template_thread_msg.replace(
      "<!-- member -->",
      msg.name
    ).replace(
      "<!-- sentTime -->",
      msg.sentTime
    ).replace(
      "<!-- text -->",
      msg.text
    ).replace(
      "<!-- stamp -->",
      () => {
        stamp_spans = "";
        stamp_exitst = false;
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
  const message_num = (await prisma.post.findMany({
    where: {
      channel: current_channel
    }
  })).length;

  await prisma.post.create({
    data: {
      channel: current_channel,
      message: message_num,
      thread: 0,
      name: name,
      text: request.body.message,
      stamps: [],
    },
  });
  response.redirect("/");
});

app.post("/send_thread", async (request, response) => {
  const message_num = (await prisma.post.findMany({
    where: {
      channel: current_channel,
      message: current_message
    }
  })).length;

  await prisma.post.create({
    data: {
      channel: current_channel,
      message: current_message,
      thread: message_num,
      name: name,
      text: request.body.message,
      stamps: [],
    },
  });
  response.redirect("/");
});

app.listen(3000);
