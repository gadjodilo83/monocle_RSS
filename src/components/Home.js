import React, { useState, useEffect } from 'react';
import { ensureConnected } from "@/utils/bluetooth/js/main";
import { replRawMode, replSend } from "@/utils/bluetooth/js/repl";
import { app } from "@/utils/app";
import { execMonocle } from "@/utils/comms";

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const relayCallback = (msg) => {
    if (!msg) {
      return;
    }
    // Hier können Sie weitere Aktionen basierend auf der empfangenen Nachricht hinzufügen
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
      setConnected(true); // Hier setzen wir auch den Zustand auf "verbunden"
    }
  }

  const sendTextToMonocle = async (text) => {
    if (!device) {
      console.error('Device not connected');
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      await device.writeValue(data);
    } catch (error) {
      console.error('Error sending data to Monocle:', error);
    }
  };

  const startRecording = () => {
    if (typeof window.webkitSpeechRecognition === 'undefined') {
      console.error('Web Speech API is not supported in this browser.');
      return;
    }

    const newRecognition = new window.webkitSpeechRecognition();
    newRecognition.lang = 'de-DE';

    newRecognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      sendTextToMonocle(text);
      await displayRizz(text);  // Hier verwenden wir displayRizz, um den Text auf dem Monocle-Display anzuzeigen
    };

    newRecognition.start();
    setIsRecording(true);
    setRecognition(newRecognition);
  };

  useEffect(() => {
    console.log("Transcript updated:", transcript);
  }, [transcript]);

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsRecording(false);
  };

const wrapText = (inputText) => {
  const block = 24;
  const words = inputText.split(' ');
  let lines = [''];
  let currentLineIndex = 0;

  words.forEach(word => {
    const currentLine = lines[currentLineIndex];

    if ((currentLine + word).length <= block) {
      lines[currentLineIndex] += word + ' ';
    } else {
      lines.push(word + ' ');
      currentLineIndex += 1;
    }
  });

  return lines;
};




async function displayRawRizz(rizz) {
    await replRawMode(true);
    await displayRizz(rizz);
}





const displayRizz = async (rizz) => {
  if (!rizz) return;

  const splitText = wrapText(rizz);
  const groupSize = 5;
  const clearCmd = "display.clear()";

  await replSend(`${clearCmd}\n`);

  for (let i = 0; i < splitText.length; i += groupSize) {
    const group = splitText.slice(i, i + groupSize);
    const textCmds = group.map((chunk, index) => {
      const xCoordinate = 0;
      const yCoordinate = index * 50;
      const cleanedChunk = cleanText(chunk.replace(/"/g, ""));
      return `display.Text('${cleanedChunk}', ${xCoordinate}, ${yCoordinate}, display.WHITE)`;
    });

    const textCmd = `display.show([${textCmds.join(", ")}])`;

    await replSend(`${textCmd}\n`);
    await delay(5000);
  }
};


const cleanText = (inputText) => {
  const replacements = {
        "\\\\": "",  // Hinweis: "\\" wird zu "\\\\" in einem String, um den Backslash zu maskieren
        '""': '"',
        "\\n": "",
        "!": ".",
        "ä": "ae",
        "ü": "ue",
        "ö": "oe",
        "Ä": "Ae",
        "Ü": "Ue",
        "Ö": "Oe",
        "ß": "ss",
        "ù": "u",
        "à": "a",
        "À": "A",
        "è": "e",
        "É": "E",
        "é": "e",
        "È": "E",
        "Ú": "U",
        "Ù": "U",
        "ó": "o",
        "Ó": "O",
        "ò": "o",
        "Ò": "O",
        "l'u": "l u",
        "l'a": "l a",
        "dall'": "dall ",
        "dell'": "dell ",
        "all'": "all ",
        "sull'": "sull ",
        "nell'": "nell ",
        "quell'": "quell ",
        "un'a": "un a",
        "un'u": "un u",
        "un'o": "un o",
        "c'è": "c e",
        "c'e": "c e",
        "nessun'": "nessun ",
        "alcun'": "alcun ",
        "ché": "che",
        "dà": "da",
        "là": "la",
        "né": "ne o",
        "sì": "si",
        "tè": "te",
        "ì": "i",
        "Ì": "I"
   };

  let cleanedText = inputText;

  for (let pattern in replacements) {
    cleanedText = cleanedText.split(pattern).join(replacements[pattern]);
  }

  return cleanedText;
};


  const cyberpunkStyle = {
    background: {
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(127deg, #012E40, #159d82)',
      fontFamily: "'Orbitron', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    button: {
      background: 'transparent',
      border: '2px solid #0ff',
      borderRadius: '5px',
      padding: '10px 20px',
      color: '#0ff',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background 0.3s',
      marginTop: '10px',
      fontFamily: "'Orbitron', sans-serif",
      '&:hover': {
        background: '#0ff',
        color: '#012E40'
      }
    },
    text: {
      color: '#0ff',
      fontSize: '18px',
      border: '2px solid #0ff',
      padding: '10px',
      minHeight: '200px',
      width: '80%',
      maxWidth: '800px',
      background: '#222',
      overflowY: 'auto',
      margin: '0 auto'
    }
  };




  return (
    <div style={cyberpunkStyle.background}>
      <button style={cyberpunkStyle.button} onClick={connectToMonocle}>CONNECT</button>


      {isRecording ? (
        <button style={cyberpunkStyle.button} onClick={stopRecording}>STOP</button>
      ) : (
        <button style={cyberpunkStyle.button} onClick={startRecording}>START</button>
      )}
      <p style={cyberpunkStyle.text}>{transcript}</p>
    </div>
  );
}
