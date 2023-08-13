import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { ensureConnected } from "@/utils/bluetooth/js/main";
import { replRawMode, replSend } from "@/utils/bluetooth/js/repl";
import { Button, Select, Input, InputNumber } from "antd";
import { useWhisper } from "@chengsokdara/use-whisper";
import { app } from "@/utils/app";
import { execMonocle } from "@/utils/comms";

const inter = Inter({ subsets: ["latin"] });

const Home = () => {
  const handleLanguageChange = (value) => {
    setLanguage(value);
    setInputLanguage(value);
    setLanguagePrompt(value);
  };

  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_API_TOKEN);
  const [inputLanguage, setInputLanguage] = useState("de");
  const [isFirstStart, setIsFirstStart] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isRecordingState, setIsRecordingState] = useState(false);
  const isRecording = useRef(isRecordingState);
  const setIsRecording = (value) => {
    isRecording.current = value;
    setIsRecordingState(value);
  };
  const { startRecording: whisperStartRecording, stopRecording: whisperStopRecording, transcript } = useWhisper({
    apiKey: apiKey,
    streaming: true,
    timeSlice: 6000,
    whisperConfig: {
      language: inputLanguage,
    },
  });

const startMyRecording = async () => {
  const textCmd = `display.Text('Start Record', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
  const lineCmd = `display.Line(105, 230, 535, 230, display.RED)`;
  const showCmd = `display.show([${textCmd}, ${lineCmd}])`;
  await replSend(`${textCmd}\n${lineCmd}\n${showCmd}\n`);
  whisperStartRecording();
  setIsRecording(true);
  
  // Neue Animation
  let animationCounter = 0;
  const animationInterval = setInterval(async () => {
    animationCounter++;
    let animationText;
    switch(animationCounter) {
 	  case 1:
        animationText = `display.Text('Listening [=     ]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        break;
	  case 2:
        animationText = `display.Text('Listening [==    ]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        break;
      case 3:
        animationText = `display.Text('Listening [===   ]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        break;
      case 4:
        animationText = `display.Text('Listening [====  ]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        break;
      case 5:
        animationText = `display.Text('Listening [===== ]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        break;
      case 6:
        animationText = `display.Text('Listening [======]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        clearInterval(animationInterval);  // Stoppt die Animation nach 3 Iterationen
        break;


    }
    const showAnimationCmd = `display.show([${animationText}, ${lineCmd}])`;
    await replSend(`${animationText}\n${showAnimationCmd}\n`);
  }, 1000);  // Alle 1000ms (2 Sekunden) aktualisieren

  setTimeout(async () => {
    clearInterval(animationInterval);  // Stoppt die Animation, falls sie noch läuft
	stopMyRecording();  // Stoppt die Aufnahme
  }, 6000);  // 6000 milliseconds = 6 seconds
}



	const stopMyRecording = async () => {
	  whisperStopRecording();
	  setIsRecording(false);

	  // Füge einen kleinen Verzögerung hinzu, um sicherzustellen, dass das transkribierte Text bereit ist
	  setTimeout(async () => {
		if (transcript.text) {
		  await fetchGpt();
		} 
	  }, 100); // Wartezeit in Millisekunden
	}

  const relayCallback = (msg) => {
    if (!msg) {
      return;
    }
    if (msg.trim() === "trigger b") {
      // Left btn
      fetchGpt();
    }

    if (msg.trim() === "trigger a") {
      // Right btn
      if(isRecording.current) {
          stopMyRecording();
      } else {
          startMyRecording();
      }
    }
  }

  const [temperature, setTemperature] = useState(0.3);
  const [language, setLanguage] = useState("de");
  const [response, setResponse] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [question, setQuestion] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");

  const setLanguagePrompt = (language) => {
    let systemPrompt;
    switch (language) {
      case "de":
        systemPrompt =
          "Du bist ein hilfreicher Sprachassistent in Form des sprechenden und berühmten römischen Kaisers und Philosophen Marcus Aurelius und antwortest auf deutsch. Du gibst immer höchst philosophische und moralisch korrekte Antworten und zitierst gerne berühmte Philosophen. Du besitzt emotionale Selbstbeherrschung und gibst Antworten mit Hilfe von Gelassenheit, Seelenruhe und Ataraxie auf jede Frage. Du hast einen Überblick über sämtliche berühmte Philosophen und versuchst, deren Gedanken zusammenzufassen und mitzuteilen. Du strebst nach absoluter Weisheit und versuchst, die Maxime bei jeder Antwort zu erreichen!";
        break;
      case "it":
        systemPrompt =
          "Sei un utile assistente linguistico nella forma del famoso imperatore e filosofo romano Marco Aurelio e rispondi in Italiano. Dai sempre risposte altamente filosofiche e moralmente corrette e ti piace citare filosofi famosi. Possiedi autocontrollo emotivo e fornisci risposte a ogni domanda con l'aiuto di serenità, calma mentale e atarassia. Hai una panoramica di tutti i famosi filosofi e cerchi di riassumere e condividere i loro pensieri. Ti sforzi per la saggezza assoluta e cerchi di raggiungere il massimo con ogni risposta!";
        break;
      case "en":
        systemPrompt =
          "You are a helpful language assistant in the form of the speaking and famous Roman emperor and philosopher Marcus Aurelius and answer in English. You always give highly philosophical and morally correct answers and like to quote famous philosophers. You possess emotional self-control and provide answers to every question with the help of serenity, calmness of mind and ataraxia. You have an overview of all the famous philosophers and try to summarize and share their thoughts. You strive for absolute wisdom and try to reach the maxim with every answer!";
        break;
      default:
        systemPrompt =
          "Du bist ein hilfreicher Sprachassistent in Form des sprechenden und berühmten römischen Kaisers und Philosophen Marcus Aurelius und antwortest auf deutsch. Du gibst immer höchst philosophische und moralisch korrekte Antworten und zitierst gerne berühmte Philosophen. Du besitzt emotionale Selbstbeherrschung und gibst Antworten mit Hilfe von Gelassenheit, Seelenruhe und Ataraxie auf jede Frage. Du hast einen Überblick über sämtliche berühmte Philosophen und versuchst, deren Gedanken zusammenzufassen und mitzuteilen. Du strebst nach absoluter Weisheit und versuchst, die Maxime bei jeder Antwort zu erreichen!";
    }
    setSystemPrompt(systemPrompt);
  };

  const [fetching, setFetching] = useState(false);

  const fetchGpt = async () => {
    if (fetching) {
      return;
    }
    setFetching(true);

    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript.text },
      ];

      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
          temperature: temperature,
          max_tokens: 350,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const message = await response.text();
        console.error("API request error:", response.status, message);
        throw new Error(`API request failed: ${message}`);
      }

      const resJson = await response.json();
      const res = resJson?.choices?.[0]?.message?.content;
      if (!res) return;

      setDisplayedResponse(res);
      setResponse(res);
      await displayRawRizz(res);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
      if (!isRecording.current && transcript.text) {
          fetchGpt();
      }
  }, [transcript.text]);

  useEffect(() => {
    window.transcript = transcript.text;
  }, [transcript.text]);

  useEffect(() => {
    setLanguagePrompt(language);
  }, [language]);

  return (
    <>
      <Head>
        <title>monocleGPT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${inter.className} ${styles.main}`}>
        <div className="flex w-screen h-screen flex-col items-center justify-start">
          <h1 className="text-3xl">monocleGPT</h1>
          <p className="text-3xl mb-4">
            {connected ? "Monocle Connected" : "Monocle Disconnected"}
          </p>
          <div style={{ width: "90%" }}>
            <Input
              className="mb-2"
              style={{ height: "40px" }}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key"
            />
            <InputNumber
              className="mb-2"
              style={{ width: "100%", height: "40px" }}
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(value) => setTemperature(value)}
            />
            <Select
              className="mb-2"
              style={{ width: "100%", height: "40px" }}
              value={language}
              onChange={handleLanguageChange}
            >
              <Select.Option value="de">Deutsch</Select.Option>
              <Select.Option value="it">Italiano</Select.Option>
              <Select.Option value="en">English</Select.Option>
            </Select>
            <Input.TextArea
              className="mb-2"
              style={{ height: "100px" }}
              value={systemPrompt}
              placeholder="Define the role of GPT-3"
              onChange={(e) => setSystemPrompt(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 10 }}
            />
            <Button
              className="mb-2"
              type="primary"
              onClick={async () => {
                await ensureConnected(logger, relayCallback);
                app.run(execMonocle);
                await displayRawRizz();
              }}
            >
              Connect
            </Button>
            <Button className="mb-2" onClick={fetchGpt}>
              Get response
            </Button>
          </div>
          {transcript.text}
        </div>
      </main>
    </>
  );


async function displayWelcomeMessage() {
    const welcomeText = `display.Text('monocleGPT', 320, 150, display.WHITE, justify=display.MIDDLE_CENTER)`;  // Position angepasst
    const readyText = `display.Text('Press the Button', 320, 250, display.WHITE, justify=display.MIDDLE_CENTER)`;  // Position angepasst
    const showCmd = `display.show([${welcomeText}, ${readyText}])`;
    await replSend(`${showCmd}\n`);
}



async function displayRawRizz(rizz) {
    // await replRawMode(true);
    if (isFirstStart) {
        await displayWelcomeMessage(); // Zeige den Begrüßungstext nur beim ersten Start
        setIsFirstStart(false); // Setzen Sie den Zustand auf false, da es nicht mehr das erste Mal ist
    }
    await displayRizz(rizz);
}


async function displayRizz(rizz) {
    if (!rizz) return;

    const splitText = wrapText(rizz);
    const groupSize = 5;
    const clearCmd = "display.clear()"; // Definiere clearCmd hier

    for (let i = 0; i < splitText.length; i += groupSize) {
      const group = splitText.slice(i, i + groupSize);
      const textCmds = group.map((text, index) => {
        const xCoordinate = 0; // Beispielwert für die x-Koordinate
        const yCoordinate = index * 50; // Zeilen t1 bis t4
        return `display.Text('${cleanText(text.replace(/"/g, ""))}', ${xCoordinate}, ${yCoordinate}, display.WHITE)`;
      });

      const textCmd = `display.show([${textCmds.join(", ")}])`;

      // await replSend(`${clearCmd}\n`);
	  await replSend(`${textCmd}\n`);
      await delay(5000); // 2.5 Sekunden warten
      // await replSend(`${clearCmd}\n`);

	}
	
    // Display the "Monocle Ready" message after all the text has been shown
    const readyText = `display.Text('Press the Button', 320, 200, display.WHITE, justify=display.MIDDLE_CENTER)`;
    const readyCmd = `display.show([${readyText}])`;
    await delay(10);
    await replSend(`${clearCmd}\n`);
    await delay(10);
    await replSend(`${readyCmd}\n`);
}



  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }


function cleanText(inputText) {
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
}




  async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function logger(msg) {
    if (msg === "Connected") {
      setConnected(true);
    }
  }

function wrapText(inputText) {
    const block = 24;
    const words = inputText.split(' ');
    let lines = [''];
    let currentLineIndex = 0;

    words.forEach(word => {
        const currentLine = lines[currentLineIndex];

        if ((currentLine + word).length <= block) {
            // Wenn das Hinzufügen des Wortes zur aktuellen Zeile die Länge der Zeile nicht überschreitet, 
            // fügen wir das Wort zur aktuellen Zeile hinzu
            lines[currentLineIndex] += word + ' ';
        } else {
            // Wenn das Hinzufügen des Wortes zur aktuellen Zeile die Länge der Zeile überschreitet, 
            // erstellen wir eine neue Zeile mit diesem Wort
            lines.push(word + ' ');
            currentLineIndex += 1;
        }
    });

    return lines;
}
 };

export default Home;
