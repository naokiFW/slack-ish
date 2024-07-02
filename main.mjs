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
const template_msg = fs.readFileSync("./message.html", "utf8");

app.get("/", async (request, response) => {
  const main_msgs = await prisma.msg.findMany({
    where: {
      channel: current_channel
    }
  });
  const thread_msgs = await prisma.msg.findMany({
    where: {
      channel: current_channel,
      message: current_message
    }
  });

  const html = template.replace(
    "<!-- main_msgs -->",
    main_msgs.map((msg) => 
      template_msg.replace(
        "<-- member -->",
        name,
      ).replace(
        "<!-- sentTime -->",
        escapeHTML(msg.sentTime),
      ).replace(
        "<!-- text -->",
        escapeHTML(msg.text),
      )
    ).join(""),
  ).replace(
    "<!-- thread_msgs -->",
    thread_msgs.map((msg) => 
      template_msg.replace(
        "<-- member -->",
        name,
      ).replace(
        "<!-- sentTime -->",
        escapeHTML(msg.sentTime),
      ).replace(
        "<!-- text -->",
        escapeHTML(msg.text),
      )
    ).join(""),
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

app.listen(3000);
