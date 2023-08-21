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
  // const supportedLanguages = ['de-DE', 'it-IT', 'en-US'];
  const [lastUpdate, setLastUpdate] = useState(Date.now()); // Initializing with the current timestamp
  const [wasStoppedManually, setWasStoppedManually] = useState(false);


const relayCallback = (msg) => {
  if (!msg) {
    return;
  }
  
//  // Prüfen, ob die Nachricht "trigger b" ist
//  if (msg.trim() === "trigger b") {
//    if (isRecording) {
//      displayRizz("START");
//    } else {
//      displayRizz("START");
//    }
//    toggleRecording();
//  }
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
    stopRecording(); // Hier stoppen wir die Aufnahme
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

    if (recognition) {
        setWasStoppedManually(true);
        recognition.onend = null;  // Verhindern Sie, dass der onend-Handler ausgelöst wird
        recognition.stop();
        setRecognition(null);
        setIsRecording(false);
    }

    startRecognition(); // Startet die Spracherkennung erneut mit der neuen Sprache
};




const startRecognition = () => {
    if (typeof window.webkitSpeechRecognition === 'undefined') {
        console.error('Web Speech API is not supported in this browser.');
        return;
    }

    if (recognition) {
        console.warn("Recognition is already running.");
        return;
    }

    const recognitionInstance = new window.webkitSpeechRecognition();
    recognitionInstance.lang = selectedLanguage;
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    let lastRecognizedText = ''; 

    recognitionInstance.onresult = async (event) => {
        let recognizedText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            recognizedText += event.results[i][0].transcript;
            if (i < event.results.length - 1) {
                recognizedText += ' '; // Fügt nur dann ein Leerzeichen hinzu, wenn es sich nicht um den letzten Eintrag handelt
            }
        }

        if (recognizedText !== lastRecognizedText) { // Aktualisiert nur, wenn sich der Text geändert hat
            await sendTextToMonocle(recognizedText.trim());
            await displayRizz(recognizedText.trim());
            setTranscript(recognizedText.trim());
            lastRecognizedText = recognizedText; // Aktualisiert den zuletzt erkannten Text
        }
    };

    recognitionInstance.onerror = (error) => {
        console.error('Recognition error:', error);
        console.log("onerror");
    };

	recognitionInstance.onend = () => {
		if (wasStoppedManually) {
			setWasStoppedManually(false);  // Setzen Sie den Zustand zurück, um ihn für das nächste Mal bereit zu halten
			return;
		}

    recognitionInstance.start();
    console.log("onend");
};

    recognitionInstance.start();
    setIsRecording(true);  // <-- Hier hinzufügen
    setRecognition(recognitionInstance);
};



const [debouncedTranscript, setDebouncedTranscript] = useState('');





useEffect(() => {
    const updateDebouncedTranscript = setTimeout(() => {
        setDebouncedTranscript(transcript);
    }, 300); // 500 ms Verzögerung

    return () => clearTimeout(updateDebouncedTranscript);
}, [transcript]);



useEffect(() => {
  if (!connected && isRecording) {
    stopRecording();
  }
}, [connected]);


useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (Date.now() - lastUpdate < 10) { // Prüfen, ob weniger als 1 Sekunde vergangen ist
      displayRizz('');
      setTranscript(''); // Optional, wenn Sie auch den transkribierten Text in der UI löschen möchten
    }
  }, 10);
  
  // Rückgabe einer Cleanup-Funktion, um den Timeout zu löschen, falls die Komponente unerwartet unmountet
  return () => clearTimeout(timeoutId);
}, [lastUpdate]);





  useEffect(() => {
    // console.log("Transcript updated:", transcript);
  }, [transcript]);




const stopRecording = () => {
    setIsRecording(false);  // <-- Hier hinzufügen

    if (recognition) {
        recognition.onend = null;  // Verhindern Sie, dass der onend-Handler ausgelöst wird
        recognition.stop();
        setRecognition(null);
    }
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

	// Zeige den Willkommenstext an
	await displayRizz("WELCOME");
}





const displayRizz = async (rizz) => {
  if (!rizz) return;

  const splitText = wrapText(rizz);
  const groupSize = 5;
  // const clearCmd = "display.clear()";

  // await replSend(`${clearCmd}\n`);
  // await delay(10); // Wartezeit nach dem Löschen

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
    await delay(2000); // Wartezeit nach dem Anzeigen
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
        "e'": "e",
        "'s": " s"


   };

    let cleanedText = inputText;
    for (let pattern in replacements) {
        const regex = new RegExp(pattern, 'g');
        cleanedText = cleanedText.replace(regex, replacements[pattern]);
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
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#0ff',
      borderRadius: '5px',
      padding: '10px 20px',
      color: '#0ff',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background 0.3s',
      marginTop: '20px',
      marginBottom: '20px',
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

const refreshPage = () => {
    window.location.reload();
}

const connectedButtonStyle = {
  ...cyberpunkStyle.button,
  color: '#00ff00',
  borderColor: '#00ff00'
};

const recordingButtonStyle = {
    ...cyberpunkStyle.button,
    color: '#00ff00',
    borderColor: '#00ff00'
};

return (
    <div style={cyberpunkStyle.background}>
        <button style={connected ? connectedButtonStyle : cyberpunkStyle.button} onClick={connectToMonocle}>
          CONNECT
        </button>
        <select value={selectedLanguage} onChange={handleLanguageChange}>
            <option value="de-DE">Deutsch</option>
            <option value="it-IT">Italiano</option>
            <option value="en-US">English</option>
        </select>
        <button style={isRecording ? recordingButtonStyle : cyberpunkStyle.button} onClick={startRecognition}>START</button>
        <button style={cyberpunkStyle.button} onClick={refreshPage}>STOP</button>
        <p style={cyberpunkStyle.text}>{transcript}</p>
    </div>
);

}
