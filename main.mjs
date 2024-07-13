import fs from "node:fs";
import express, { response } from "express";
import { PrismaClient } from "@prisma/client";
import escapeHTML from "escape-html";
import { channel } from "node:diagnostics_channel";
import { quicksort } from "./sort.mjs";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));
const prisma = new PrismaClient();


var current_channel = 1;
var current_message = Array(10); //適当
current_message.fill(0);
var member_id = 1;
var stamp_box_enable = false;

const template = fs.readFileSync("./template.html", "utf-8");
const template_main_msg = fs.readFileSync("./main_message.html", "utf8");
const template_thread_msg = fs.readFileSync("./thread_message.html", "utf-8");

app.get("/", async (request, response) => {
  var all_members = await prisma.member.findMany();
  all_members = quicksort(0, all_members.length - 1, all_members);
  var all_channels = await prisma.channel.findMany();
  all_channels = quicksort(0, all_channels.length - 1, all_channels);

  var all_main_msg = await prisma.msg.findMany({
    where: {
      channel: current_channel,
      thread: 0
    }
  });

  var all_thread_msg = await prisma.msg.findMany({
    where: {
      channel: current_channel,
      message: current_message[current_channel - 1]
    }
  });

  if (all_main_msg.length === 0) {
    const html = template.replace(
      "<!-- channels -->",
      all_channels.map( (channel) =>
        `<button class="ch" onclick="change_ch(${channel.id})">#${channel.name}</button>`
      ).join("")
    ).replace(
      "<!-- channel name -->",
      `#${all_channels[current_channel - 1].name}`
    ).replace(
      "<!-- main_msgs -->",
      "このチャンネルにはメッセージがありません"
    );

    response.send(html);
    return;
  }
  const main_msgs = quicksort(0, all_main_msg.length - 1, all_main_msg).map( (msg) => 
    template_main_msg.replace(
      "<!-- msg_id -->",
      msg.message
    ).replace(
      "<!-- member -->",
      all_members[msg.member_id - 1].name
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
          return `<button class="reply" onclick="change_msg(${msg.message})">${msg.reply}件の返信</button>`;
        } else {
          return "";
        }
      }
    ).replace(
      "<!-- control panel -->",
      `<button class="reply_button" onclick="change_msg(${msg.message})">返信</button>`
      +`<button class="add_stamp" onclick="open_stamps(${msg.message}, ${msg.thread})">スタンプ</button>`
    )
  ).join("");
  
  all_thread_msg = quicksort(0, all_thread_msg.length - 1, all_thread_msg);
  var thread_msgs = template_main_msg.replace(
    "<!-- msg_id -->",
    all_thread_msg[0].message
  ).replace(
    "<!-- member -->",
    all_members[all_thread_msg[0].member_id - 1].name
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
  ).replace(
    "<!-- control panel -->",
    `<button class="add_stamp" onclick="open_stamps(${all_thread_msg[0].message}, 0)">スタンプ</button>`
  );

  if (all_thread_msg[0].reply > 0) {
    thread_msgs += `<div class="divide_thread">${all_thread_msg[0].reply}件の返信</div>`;
  }

  all_thread_msg.splice(0, 1);
  thread_msgs += all_thread_msg.map( (msg) =>
    template_thread_msg.replace(
      "<!-- member -->",
      all_members[msg.member_id - 1].name
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
      "<!-- control panel -->",
      `<button class="add_stamp" onclick="open_stamps(${msg.message}, ${msg.thread})">スタンプ</button>`
    )
  ).join("");

  const html = template.replace(
    "<!-- stamp_box_enable -->",
    () => {
      if (stamp_box_enable) {
        return "inline-box";
      } else {
        return "none";
      }
    }
  ).replace(
    "<!-- channels -->",
    all_channels.map( (channel) =>
      `<button class="ch" onclick="change_ch(${channel.id})">#${channel.name}</button>`
    ).join("")
  ).replace(
    "<!-- channel name -->",
    `#${all_channels[current_channel - 1].name}`
  ).replace(
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
      member_id: member_id,
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
      message: current_message[current_channel - 1]
    }
  })).length;

  await prisma.msg.create({
    data: {
      channel: current_channel,
      message: current_message[current_channel - 1],
      thread: message_num,
      member_id: member_id,
      text: request.body.message,
      stamps: [],
      reply: 0,
    },
  });
  await prisma.msg.updateMany({
    where: {
      AND: [
        {channel: current_channel},
        {message: current_message[current_channel - 1]},
        {thread: 0}
      ]
    },
    data: {
      reply: message_num
    }
  });
  response.redirect("/");
});

app.post("/change_ch", (request, response) => {
  current_channel = Number(request.body.ch_id);
  // current_message[current_channel - 1] = 0; //適当
  response.redirect("/");
});

app.post("/change_msg", (request, response) => {
  current_message[current_channel - 1] = Number(request.body.msg_id);
  response.redirect("/");
});

// stamp
var stamp_ch = current_channel;
var stamp_msg = current_message;
var stamp_thr = 0;

app.post("/open_stamp_box", (request, response) => {
  stamp_ch = current_channel;
  stamp_msg = request.body.msg_id;
  stamp_thr = request.body.thr_id;
  stamp_box_enable = true;
  response.redirect("/");
});

app.get("/close_stamp_box", (request, response) => {
  stamp_box_enable = false;
  response.redirect("/");
});

app.listen(3000);
