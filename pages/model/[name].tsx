import React from "react";
import { useRouter } from "next/router";

import Head from "next/head";

export default function Model() {
  const router = useRouter();
  const { name } = router.query;

  return (
    <div className="container">
      <Head>
        <title>GPT3 tweets: {name}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="px-16 py-24">
        <h1 className="text-5xl font-bold py-6">GPT-3 tweets for {name}</h1>
      </div>
    </div>
  );
}
