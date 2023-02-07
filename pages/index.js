import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Gpt3 Tweet generator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="px-16 py-24">
        <h1 className="text-5xl font-bold py-6">
          Top secret GPT-3 tweet generator
        </h1>
        <h2 className="text-3xl">You have to know a link to generate tweets</h2>
      </div>
    </div>
  );
}
