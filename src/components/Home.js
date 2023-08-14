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
  newRecognition.continuous = true;

  newRecognition.onresult = async (event) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const text = event.results[i][0].transcript;
      setTranscript(prevTranscript => prevTranscript + " " + text);
      sendTextToMonocle(text);
      await displayTextOnMonocle(text);
    }
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


  const cyberpunkStyle = {
    container: {
      backgroundColor: '#121212',
      color: '#08f',
      fontFamily: "'Orbitron', sans-serif",
      padding: '20px',
      border: '3px solid #ff2079',
      borderRadius: '5px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      margin: 'auto',
      marginTop: '50px'
    },
    button: {
      backgroundColor: '#ff2079',
      color: '#121212',
      border: 'none',
      padding: '10px 20px',
      margin: '10px 0',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'transform 0.2s, background-color 0.3s'
    },
    text: {
      color: '#1fe3a1',
      fontSize: '18px',
      border: '1px solid #08f',
      padding: '10px',
      width: '80%',
      textAlign: 'center',
      marginTop: '20px'
    }
  };

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
