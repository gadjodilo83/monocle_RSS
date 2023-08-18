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
  const [selectedLanguage, setSelectedLanguage] = useState('de-DE'); // Standardmäßig auf Deutsch

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
      return;
    }

    try {
      const encoder = new TextEncoder("utf-8");
      const message = "res:" + text; // Zum Beispiel, wenn Sie das Präfix "res:" hinzufügen müssen.
	  const data = encoder.encode(message);	  await device.writeValue(data);
    } catch (error) {
      console.error('Error sending data to Monocle:', error);
    }
};



  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };

const startRecognition = () => {
    if (typeof window.webkitSpeechRecognition === 'undefined') {
      console.error('Web Speech API is not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = selectedLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

recognition.onresult = async (event) => {
  let recognizedText = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
          recognizedText += event.results[i][0].transcript + ' ';
      }
  }

  // Zuerst den Zustand in React aktualisieren, um den Text im Browser sofort anzuzeigen
  setTranscript(recognizedText.trim());

  // Dann den Text zum Monocle-Display senden
  await Promise.all([
      sendTextToMonocle(recognizedText.trim()),
      displayRizz(recognizedText.trim())
  ]);
};

    recognition.onerror = (error) => {
      console.error('Recognition error:', error);
    };

    recognition.onend = () => {
      if (isRecording) {
        startRecognition();
      }
    };

    recognition.start();
    setRecognition(recognition);
};


  const toggleRecording = () => {
    if (isRecording) {
      if (recognition) {
        recognition.stop();
        setRecognition(null);
      }
      setIsRecording(false);
    } else {
      startRecognition();
      setIsRecording(true);
    }
  };



  useEffect(() => {
    if (isRecording) {
      startRecognition(); // Starte die Erkennung, wenn die Aufzeichnung gestartet ist
    }
  }, [isRecording]);


  useEffect(() => {
    // console.log("Transcript updated:", transcript);
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
  // const clearCmd = "display.clear()";

  //await replSend(`${clearCmd}\n`);
  //await delay(10); // Wartezeit nach dem Löschen

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
    await delay(5000); // Wartezeit nach dem Anzeigen
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
        "Ì": "I",
        "e'": "e"
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
      <select value={selectedLanguage} onChange={handleLanguageChange}>
        <option value="de-DE">Deutsch</option>
        <option value="it-IT">Italiano</option>
        <option value="en-US">English</option>
      </select>
      <button style={cyberpunkStyle.button} onClick={toggleRecording}>
        {isRecording ? "STOP" : "START"}
      </button>
      <p style={cyberpunkStyle.text}>{transcript}</p>
    </div>
  );
}
