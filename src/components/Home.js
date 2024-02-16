import React, { useState, useEffect } from 'react';
import { ensureConnected } from "@/utils/bluetooth/js/main";
import { replRawMode, replSend } from "@/utils/bluetooth/js/repl";
import { app } from "@/utils/app";
import { execMonocle } from "@/utils/comms";
import axios from 'axios';
import xml2js from 'xml2js';

export default function Home() {
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [feedTitles, setFeedTitles] = useState([]);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [rssFeedUrl, setRssFeedUrl] = useState('https://www.srf.ch/news/bnf/rss/19032223'); // Standardwert für den RSS-Feed

  const RSSFEEDS = 'https://www.srf.ch/news/bnf/rss/19032223';

  useEffect(() => {
    fetchRSSFeedTitles(rssFeedUrl); // URL als Parameter
  }, [rssFeedUrl]); // Abhängigkeit hinzufügen
  
  

  const fetchRSSFeedTitles = async (url) => {
    const response = await axios.get(url);
    const feed = await xml2js.parseStringPromise(response.data);
    const titles = feed.rss.channel[0].item.map(item => item.title[0]);
    setFeedTitles(titles);
  };




const relayCallback = (msg) => {
  if (!msg) {
    return;
  }
}

const connectToMonocle = async () => {
  try {
    await ensureConnected(logger, relayCallback);
    app.run(execMonocle);
    await displayRawRizz();
  } catch (error) {
    console.error('Error connecting to Monocle:', error);
  }
};

async function logger(msg, deviceObj) {
  if (msg === "Connected") {
    setDevice(deviceObj);
    setConnected(true);
  } else if (msg === "Disconnected" && connected) {  // Achten Sie darauf, dass der Zustand zuvor "Connected" war
    setConnected(false);
  }
}





  const displayNextTitle = async () => {
    if (currentTitleIndex < feedTitles.length) {
      const title = feedTitles[currentTitleIndex];
      await displayRawRizz(title);
      setCurrentTitleIndex(currentTitleIndex + 1);
    } else {
      console.log("No more titles to display.");
    }
  };

  async function logger(msg, deviceObj) {
    if (msg === "Connected") {
      setDevice(deviceObj);
      setConnected(true);
    }
  }

  async function displayRawRizz(rizz) {
    await replRawMode(true);
    await displayRizz(rizz);
  }


const cleanText = (text) => {
  return text.replace(/[^a-zA-Z0-9\s]/g, "");
};

const displayRizz = async (rizz) => {
  if (!rizz) return;

  const splitText = wrapText(rizz);
  const groupSize = 5; // Größe jeder Gruppe von Textzeilen

  for (let i = 0; i < splitText.length; i += groupSize) {
    const group = splitText.slice(i, i + groupSize);
    const textCmds = group.map((chunk, index) => {
      const xCoordinate = 0;
      const yCoordinate = index * 50; // Positionierung jeder Zeile
      const cleanedChunk = cleanText(chunk.replace(/"/g, ""));
      return `display.Text('${cleanedChunk}', ${xCoordinate}, ${yCoordinate}, display.WHITE)`;
    }).join(",\n");

    // Gruppieren der Textbefehle und Senden als ein Block
    const commands = `import display\n${textCmds}\ndisplay.show([${textCmds}])`;
    await replSend(commands);
    await new Promise(resolve => setTimeout(resolve, 500)); // Kurze Pause, um dem Gerät Zeit zum Verarbeiten zu geben
  }
};




  const wrapText = (inputText) => {
    const block = 24;
    let lines = [];
    let currentLine = '';

    inputText.split(' ').forEach(word => {
      if ((currentLine + word).length <= block) {
        currentLine += word + ' ';
      } else {
        lines.push(currentLine);
        currentLine = word + ' ';
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

 const updateRssFeedUrl = (e) => {
    e.preventDefault(); // Verhindere das Neuladen der Seite
    const newUrl = e.target.elements.rssFeed.value; // Zugriff auf den Wert des Textfeldes
    setRssFeedUrl(newUrl); // Aktualisiere den Zustand
  };



  return (
    <div>
      <form onSubmit={updateRssFeedUrl}>
        <input type="text" name="rssFeed" defaultValue={rssFeedUrl} />
        <button type="submit">RSS-Feed laden</button>
      </form>
      <button onClick={connectToMonocle} disabled={connected}>CONNECT</button>
      <button onClick={displayNextTitle} disabled={!connected || currentTitleIndex >= feedTitles.length}>Display Next Title</button>
    </div>
  );
}
