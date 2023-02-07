import React from "react";
import { useRouter } from "next/router";

import Head from "next/head";

export default function Model() {
  const { query, isReady } = useRouter();
  const { name } = query;

  if (isReady) {
    fetch(`/api/model/${name}/generate_tweet`)
      .then((response) => response.json())
      .then((data) => console.log(data));
  }

  return (
    <div className="container">
      <Head>
        <title>GPT3 tweets: {isReady ? name : "Loading..."}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="px-16 py-24">
        <h1 className="text-5xl font-bold py-6">GPT-3 tweets for {name}</h1>
      </div>
    </div>
  );
}
