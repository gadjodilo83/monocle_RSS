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
  const [connected, setConnected] = useState(false);
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [interactionDisabled, setInteractionDisabled] = useState(false);
  const isRecording = useRef(isRecordingState);
  const setIsRecording = (value) => {
    isRecording.current = value;
    setIsRecordingState(value);
  };
  const { startRecording: whisperStartRecording, stopRecording: whisperStopRecording, transcript } = useWhisper({
    apiKey: apiKey,
    streaming: true,
    timeSlice: 5000,
    whisperConfig: {
      language: inputLanguage,
    },
  });

const startMyRecording = async () => {
  setInteractionDisabled(true);  // Deaktivieren Sie Interaktionen, wenn die Aufnahme beginnt
  const textCmd = `display.Text('Start Record', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
  const lineCmd = `display.Line(175, 230, 465, 230, display.RED)`;
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
        animationText = `display.Text('Listening [=  ]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        break;
      case 2:
        animationText = `display.Text('Listening [== ]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        break;
      case 3:
        animationText = `display.Text('Listening [===]', 320, 200, display.RED, justify=display.MIDDLE_CENTER)`;
        clearInterval(animationInterval);  // Stoppt die Animation nach 3 Iterationen
        break;
    }
    const showAnimationCmd = `display.show([${animationText}, ${lineCmd}])`;
    await replSend(`${animationText}\n${showAnimationCmd}\n`);
  }, 2000);  // Alle 2000ms (2 Sekunden) aktualisieren

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
		} else {
		  console.log('No transcript available');
		}
	  }, 1000); // Wartezeit in Millisekunden
	}

  const relayCallback = (msg) => {
    if (!msg) {
      return;
    }
  if (msg.trim() === "trigger b" && !fetching) {
    console.log("Button B pressed");
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
      console.log("Fetch already in progress");
      return;
    }
    setFetching(false);
    console.log("fetchGpt called");

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
          max_tokens: 300,
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


  async function displayRawRizz(rizz) {
    await replRawMode(true);
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

      await delay(10); // 2.5 Sekunden warten
      await replSend(`${clearCmd}\n`);
	  await delay(10); // Warten Sie 100 Millisekunden
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
    setInteractionDisabled(false);
}



  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }


function cleanText(inputText) {
  let cleanedText = inputText.replace(/\\/g, ""); // remove backslashes
  cleanedText = cleanedText.replace(/""/g, '"'); // replace double quotes with single quotes
  cleanedText = cleanedText.replace(/\n/g, ""); // remove line breaks
  cleanedText = cleanedText.replace(/ä/g, "ae"); // replace "ä" with "ae"
  cleanedText = cleanedText.replace(/ü/g, "ue"); // replace "ü" with "ue"
  cleanedText = cleanedText.replace(/ö/g, "oe"); // replace "ö" with "oe"
  cleanedText = cleanedText.replace(/Ä/g, "Ae"); // replace "Ä" with "Ae"
  cleanedText = cleanedText.replace(/Ü/g, "Ue"); // replace "Ü" with "Ue"
  cleanedText = cleanedText.replace(/Ö/g, "Oe"); // replace "Ö" with "Oe"
  cleanedText = cleanedText.replace(/ß/g, "ss"); // replace "ß" with "ss"
  cleanedText = cleanedText.replace(/ù/g, "u"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/à/g, "a"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/À/g, "A"); // replace "ä" with "ae"
  cleanedText = cleanedText.replace(/è/g, "e"); // replace "ü" with "ue"
  cleanedText = cleanedText.replace(/É/g, "E"); // replace "ö" with "oe"
  cleanedText = cleanedText.replace(/é/g, "e"); // replace "Ä" with "Ae"
  cleanedText = cleanedText.replace(/È/g, "E"); // replace "Ü" with "Ue"
  cleanedText = cleanedText.replace(/Ú/g, "U"); // replace "Ö" with "Oe"
  cleanedText = cleanedText.replace(/Ù/g, "U"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/ó/g, "o"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/Ó/g, "O"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/ò/g, "o"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/Ò/g, "O"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/l'u/g, "l u"); // replace "Ä" with "Ae"
  cleanedText = cleanedText.replace(/l'a/g, "l a"); // replace "Ü" with "Ue"
  cleanedText = cleanedText.replace(/dall'/g, "dall "); // replace "Ö" with "Oe"
  cleanedText = cleanedText.replace(/dell'/g, "dell "); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/all'/g, "all "); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/sull'/g, "sull "); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/nell'/g, "nell "); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/quell'/g, "quell "); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/un'a/g, "un a"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/un'u/g, "un u"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/un'o/g, "un o"); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/c'è/g, "c e"); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/c'e/g, "c e"); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/nessun'/g, "nessun "); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/alcun'/g, "alcun "); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/ché/g, "che"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/dà/g, "da"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/là/g, "la"); // replace "ù" with "u"
  cleanedText = cleanedText.replace(/né/g, "ne o"); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/sì/g, "si"); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/tè/g, "te"); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/ì/g, "i"); // replace "ù" with "u"  
  cleanedText = cleanedText.replace(/Ì/g, "I"); // replace "ù" with "u"  
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
    const block = 23;
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
