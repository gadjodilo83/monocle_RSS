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
    const command = `display.Text('${text}', 0, 0, display.WHITE)`;
    const showCmd = `display.show([${command}])`;
    await replSend(`${showCmd}\n`);
};


return (
  <div>
    <button onClick={connectToMonocle}>Mit Monocle verbinden</button>
    {isRecording ? (
      <button onClick={stopRecording}>Stoppen</button>
    ) : (
      <button onClick={startRecording}>Starten</button>
    )}
    <p>{transcript}</p>
  </div>
);
}
