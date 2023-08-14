import React, { useState, useEffect } from 'react';
import { ensureConnected } from "@/utils/bluetooth/js/main";
import { replRawMode, replSend } from "@/utils/bluetooth/js/repl";


export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [recognition, setRecognition] = useState(null);



const relayCallback = (msg) => {
  if (!msg) {
    return;
  }
  // Hier können Sie weitere Aktionen basierend auf der empfangenen Nachricht hinzufügen
}



const connectToMonocle = async () => {
  try {
    await ensureConnected(logger, relayCallback); 

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
  newRecognition.continuous = true;  // Hinzugefügt für kontinuierliche Aufnahme

  newRecognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    setTranscript(text);
    sendTextToMonocle(text);
    await displayTextOnMonocle(text);
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

const displayTextOnMonocle = async (text) => {
  const splitText = wrapText(text);
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


useEffect(() => {
  // Setzen Sie den Hintergrund des gesamten Dokuments auf eine dunkle Farbe, wenn die Komponente gemountet wird
  document.body.style.backgroundColor = "#121212";

  // Setzen Sie den Hintergrund zurück, wenn die Komponente ungemounted wird
  return () => {
    document.body.style.backgroundColor = "";
  };
}, []);


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
    minHeight: '200px',  // Erhöht die minimale Höhe des Textfeldes
    width: '80%',        // Setzt die Breite des Textfeldes auf 80% des übergeordneten Elements
    maxWidth: '800px',   // Setzt eine maximale Breite, um zu verhindern, dass es zu breit wird
    background: '#222',
    overflowY: 'auto',
    margin: '0 auto'     // Zentriert das Textfeld horizontal
  }
}


  return (
    <div style={cyberpunkStyle.container}>
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
