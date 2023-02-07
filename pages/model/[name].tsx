import React, { useState } from "react";
import { useRouter } from "next/router";

import Head from "next/head";

async function generateTweet(name) {
  const res = await fetch(`/api/model/${name}/generate_tweet`);
  const json = await res.json();
  console.log("generateTweet", json);

  return json;
}

function TweetSpinner() {
  return (
    <svg
      className="animate-spin h-10 w-10 text-indigo-500"
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
        stroke-width="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

function Tweet({ text, isLoading }) {
  return (
    <div className="p-6 rounded-2xl bg-white">
      {isLoading ? <TweetSpinner /> : <p className="text-3xl">{text}</p>}
    </div>
  );
}

export default function Model() {
  const { query, isReady } = useRouter();
  const { name } = query;

  const [tweet, setTweet] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log("Router", query, isReady);
  if (isReady) {
    console.log("Generating tweet for", name);
    if (!tweet && !error && !isLoading) {
      setIsLoading(true);
      generateTweet(name).then((json) => {
        console.log("generateTweet", json);
        if (json.error) {
          setError(json.error);
          setIsLoading(false);
        } else {
          setTweet(json.text);
          setIsLoading(false);
        }
      });
    }
  }

  return (
    <div className="container">
      <Head>
        <title>GPT3 tweets: {isReady ? name : "Loading..."}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="px-16 py-24">
        <h1 className="text-5xl font-bold py-6">{name}: GPT-3 tweets</h1>
        <Tweet text={tweet} isLoading={isLoading} />
      </div>
    </div>
  );
}
