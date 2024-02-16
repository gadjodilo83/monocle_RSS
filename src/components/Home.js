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
  const [rssFeedUrl, setRssFeedUrl] = useState('https://rss.nytimes.com/services/xml/rss/nyt/World.xml'); // Standardwert für den RSS-Feed

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


const relayCallback = (msg) => {
  if (!msg) {
    return;
  }

  // Vorwärts spulen mit Trigger A
  if (msg.trim() === "trigger a") {
    displayNextTitle(); // Vorher definierte Funktion zum Anzeigen des nächsten Titels
  }

  // Rückwärts spulen mit Trigger B
  if (msg.trim() === "trigger b") {
    displayPreviousTitle(); // Vorher definierte Funktion zum Anzeigen des vorherigen Titels
  }
}



const displayNextTitle = () => {
  setCurrentTitleIndex(prevIndex => {
    const nextIndex = prevIndex + 1 < feedTitles.length ? prevIndex + 1 : prevIndex;
    displayRawRizz(feedTitles[nextIndex]);
    return nextIndex; // Update index only if next title is available
  });
};

const displayPreviousTitle = () => {
  setCurrentTitleIndex(prevIndex => {
    const nextIndex = prevIndex - 1 >= 0 ? prevIndex - 1 : prevIndex;
    displayRawRizz(feedTitles[nextIndex]);
    return nextIndex; // Update index only if previous title is available
  });
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
  <div style={{ margin: '20px', fontFamily: 'Arial, sans-serif' }}>
    <form onSubmit={updateRssFeedUrl} style={{ marginBottom: '20px' }}>
      <input
        type="text"
        name="rssFeed"
        defaultValue={rssFeedUrl}
        style={{ marginRight: '10px', padding: '10px', width: '500px', borderRadius: '5px', border: '1px solid #ccc' }}
      />
      <button type="submit" style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>
        RSS-Feed laden
      </button>
    </form>
    <button onClick={connectToMonocle} disabled={connected} style={{ marginRight: '10px', padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: connected ? '#6c757d' : '#28a745', color: 'white', cursor: 'pointer' }}>
      {connected ? 'CONNECTED' : 'CONNECT'}
    </button>
    <button onClick={displayPreviousTitle} disabled={!connected} style={{ marginRight: '10px', padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: !connected ? '#6c757d' : '#17a2b8', color: 'white', cursor: 'pointer' }}>
      Previous Title
    </button>
    <button onClick={displayNextTitle} disabled={!connected} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: !connected ? '#6c757d' : '#ffc107', color: 'white', cursor: 'pointer' }}>
      Next Title
    </button>
  </div>
);

}
