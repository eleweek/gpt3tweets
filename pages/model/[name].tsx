import React, { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import classnames from "classnames";

import Head from "next/head";

async function requestTweetFromOpenAi(name) {
  const res = await fetch(`/api/model/${name}/generate_tweet`);
  const json = await res.json();

  return json;
}

function GenerateTweetButton({ onClick, isGenerating }) {
  return (
    <button
      disabled={isGenerating}
      onClick={onClick}
      type="button"
      className={classnames(
        isGenerating && "cursor-not-allowed",
        isGenerating ? "bg-indigo-300" : "bg-indigo-500",
        "hover:scale-110 hover:translate-x-[5%] inline-flex items-center px-6 py-3 font-semibold leading-6 text-xl shadow rounded-md text-white transition ease-in-out duration-300"
      )}
    >
      {isGenerating && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {isGenerating ? "Generating tweet" : "Generate tweet"}
    </button>
  );
}

const transition = { type: "spring", stiffness: 500, damping: 50, mass: 1 };
function Tweet({ text }) {
  // const animations = {
  //   layout: true,
  //   initial: 'out',
  //   style: {
  //     // position: isPresent ? 'static' : 'absolute'
  //     position: 'static'
  //   },
  //   animate: 'in',
  //   // whileTap: 'tapped',
  //   variants: {
  //     in: { scaleY: 1, opacity: 1 },
  //     out: { scaleY: 0, opacity: 0, zIndex: -1 },
  //   },
  //   transition
  // }

  return (
    <motion.div layout className="p-4 rounded-xl bg-white mb-4">
      <p className="text-2xl">{text}</p>
    </motion.div>
  );
}

export default function Model() {
  const { query, isReady } = useRouter();
  const { name } = query;

  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTweet = useCallback(() => {
    if (isReady) {
      console.log("Generating tweet for", name);
      if (!isGenerating) {
        setIsGenerating(true);
        requestTweetFromOpenAi(name).then((json) => {
          console.log("generateTweet", json);
          if (json.error) {
            setError(json.error);
            setIsGenerating(false);
          } else {
            setTweets([{ text: json.text, id: json.id }, ...tweets]);
            setIsGenerating(false);
          }
        });
      }
    }
  }, [
    name,
    setIsGenerating,
    setError,
    setTweets,
    tweets,
    error,
    isGenerating,
    isReady,
  ]);

  console.log("Router", query, isReady);

  return (
    <div className="container">
      <Head>
        <title>GPT3 tweets: {isReady ? name : "Loading..."}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="px-16 py-16">
        <GenerateTweetButton
          onClick={generateTweet}
          isGenerating={isGenerating}
        />
        <h1 className="text-6xl font-bold py-6">{name}: GPT-3 tweets</h1>
        <AnimatePresence>
          {tweets.map((tweet) => (
            <Tweet key={tweet.id} text={tweet.text} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
