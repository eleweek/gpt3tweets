import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

import classnames from "classnames";

import Head from "next/head";
import useLocalStorage from "use-local-storage";

async function requestTweetFromOpenAi(name) {
  const res = await fetch(`/api/model/${name}/generate_tweet`);
  const json = await res.json();

  return json;
}

async function getHistory(name) {
  const res = await fetch(`/api/model/${name}/history`);
  const json = await res.json();

  return json;
}

async function sendVote(id, deltaVotes) {
  const res = await fetch(`/api/tweet/${id}/vote?deltaVotes=${deltaVotes}`);
  const json = await res.json();

  return json;
}

function Spinner() {
  return (
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
  );
}

function GenerateTweetButton({ onClick, isGenerating, isLoadingHistory }) {
  const buttonCommonClasses =
    "inline-flex items-center px-6 py-3 font-semibold leading-6 text-xl rounded-md text-white";
  return (
    <div className="mr-8">
      <button
        disabled={isGenerating}
        onClick={onClick}
        type="button"
        className={classnames(
          (isGenerating || isLoadingHistory) && "cursor-not-allowed",
          isGenerating || isLoadingHistory ? "bg-indigo-300" : "bg-indigo-500",
          buttonCommonClasses,
          "absolute hover:scale-110 hover:translate-x-[5%] transition ease-in-out duration-300"
        )}
      >
        {(isGenerating || isLoadingHistory) && <Spinner />}
        {isLoadingHistory
          ? "Loading..."
          : isGenerating
          ? "Generating tweet"
          : "Generate tweet"}
      </button>
      <div className={classnames(buttonCommonClasses, "invisible")}>
        <div className="-ml-1 mr-3 h-5 w-5" /> Generating tweet
      </div>
    </div>
  );
}

function VoteButton({ Icon, onClick, className }) {
  const ANIMATION_DURATION = 300;
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      // as a hack we call onClick after the animation is done
      setTimeout(onClick, 50);
    }, ANIMATION_DURATION);
  }, [onClick, setIsAnimating, isAnimating]);

  return (
    <Icon
      onClick={handleClick}
      className={classnames(className, isAnimating && "animate-ping")}
    />
  );
}

let _latestTweetScroll = 0;
function Tweet({ layoutId, text, votes, myVote, onVoteUp, onVoteDown }) {
  _latestTweetScroll = window.scrollY;
  return (
    <motion.div
      layout
      onLayoutAnimationStart={() => {
        // This hack is needed for chrome because framer-motion sometimes causes weird jumping issues
        // when reordering from the bottom of the page
        if (Math.abs(window.scrollY - _latestTweetScroll) > 100) {
          window.scrollTo(0, _latestTweetScroll);
        }
      }}
      transition={{
        layout: {
          duration: 0.35,
        },
      }}
      layoutId={layoutId}
      className="p-4 rounded-xl bg-white mb-4 flex flex-row"
    >
      <div className="flex flex-col content-center mr-5">
        <VoteButton
          Icon={ChevronUpIcon}
          onClick={onVoteUp}
          className={classnames(
            "h-6 w-6 hover:cursor-pointer",
            myVote <= 0 ? "text-gray-300" : "text-emerald-700 stroke-[3px]"
          )}
        />
        <div
          className={classnames(
            "text-xl text-center",
            votes < 0
              ? "text-amber-700"
              : votes === 0
              ? "text-gray-700"
              : "text-emerald-700"
          )}
        >
          {votes}
        </div>
        <VoteButton
          Icon={ChevronDownIcon}
          onClick={onVoteDown}
          className={classnames(
            "h-6 w-6 hover:cursor-pointer",
            myVote >= 0 ? "text-gray-300" : "text-amber-700 stroke-[3px]"
          )}
        />
      </div>
      <p className="text-2xl">{text}</p>
    </motion.div>
  );
}

function SortBy({ onSortByVotes, isSortByVotes }) {
  const selection = (
    <motion.div
      layout
      layoutId="sort-by-selection"
      className="absolute bg-white shadow flex items-center rounded-md py-[0.4rem] pl-2 pr-3 text-xl font-semibold"
    >
      <span className="text-slate-600 ml-2 invisible">
        {isSortByVotes ? "Votes" : "Created"}
      </span>
    </motion.div>
  );

  return (
    <div className="flex flex-row items-center">
      <div className="text-xl font-bold mr-4">Sort by</div>
      <div
        className="flex space-x-1 rounded-lg bg-slate-200 p-0.5"
        role="tablist"
        aria-orientation="horizontal"
      >
        {[
          ["Votes", true],
          ["Created", false],
        ].map(([label, value]) => (
          <div>
            {isSortByVotes === value && selection}
            <button
              onClick={() => onSortByVotes(value)}
              className="flex items-center rounded-md py-[0.4rem] pl-2 pr-3 text-xl font-semibold"
              type="button"
            >
              <span
                className={classnames(
                  isSortByVotes === value ? "text-slate-900" : "text-slate-600",
                  "ml-2 z-10"
                )}
              >
                {label}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Model() {
  const { query, isReady } = useRouter();
  const { name } = query;

  // initial `null` state is signals that no history has been fetched yet
  const [tweets, setTweets] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSortByVotes, setIsSortByVotes] = useState(true);
  const [myVotes, setMyVotes] = useLocalStorage("myVotes", {});

  const setAndSortTweets = useCallback(
    (updatedTweets, isSortByVotes) => {
      updatedTweets.sort((a, b) => {
        if (isSortByVotes && a.votes !== b.votes) return b.votes - a.votes;

        return b.id - a.id;
      });
      setTweets(updatedTweets);
    },
    [setTweets]
  );

  const handleSortByVotes = useCallback(
    (isSortByVotes) => {
      setIsSortByVotes(isSortByVotes);

      setAndSortTweets([...tweets], isSortByVotes);
    },
    [setAndSortTweets, tweets, setTweets]
  );

  const vote = useCallback(
    (id, voteDirection) => {
      console.log("vote", id, voteDirection);
      if (isReady && name && voteDirection !== (myVotes[id] || 0)) {
        let deltaVotes = voteDirection - (myVotes[id] || 0);
        // Opportunistically update the vote count
        setMyVotes({ ...myVotes, [id]: voteDirection });

        const updatedTweets = [...tweets];
        updatedTweets.find((t) => t.id === id).votes += deltaVotes;
        setAndSortTweets(updatedTweets, isSortByVotes);

        console.log(
          "vote",
          "voteDirection",
          voteDirection,
          "deltaVotes",
          deltaVotes
        );

        // Then send the vote to the server, just log the result after it comes
        sendVote(id, deltaVotes).then((json) => {
          console.log("sendVote", json);
          if (json.error) {
            console.log("Error sending vote", json.error);
          } else {
            console.log("Vote sent", json.id, json.votes);
          }
        });
      }
    },
    [
      myVotes,
      setMyVotes,
      isReady,
      name,
      tweets,
      setAndSortTweets,
      isSortByVotes,
    ]
  );

  useEffect(() => {
    if (isReady && name) {
      getHistory(name).then((json) => {
        if (json.error) {
          console.log("Error", json.error);
        } else {
          console.log("Tweet history", json.tweets);
          setTweets(json.tweets);
        }
      });
    }
  }, [isReady, name]);

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
            setTweets([
              { text: json.text, id: json.id, votes: json.votes },
              ...tweets,
            ]);
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
        <div className="flex flex-row items-center mb-3">
          <GenerateTweetButton
            onClick={generateTweet}
            isGenerating={isGenerating}
            isLoadingHistory={tweets === null}
          />
          <SortBy
            onSortByVotes={handleSortByVotes}
            isSortByVotes={isSortByVotes}
          />
        </div>
        <h1 className="text-6xl font-bold py-6">{name}: GPT-3 tweets</h1>
        <motion.div layout>
          {tweets &&
            tweets.map((tweet) => {
              const myVote = myVotes[tweet.id] || 0;
              return (
                <Tweet
                  layoutId={tweet.id}
                  key={tweet.id}
                  text={tweet.text}
                  votes={tweet.votes}
                  myVote={myVote}
                  onVoteDown={() => vote(tweet.id, myVote === -1 ? 0 : -1)}
                  onVoteUp={() => vote(tweet.id, myVote === 1 ? 0 : 1)}
                />
              );
            })}
        </motion.div>
      </div>
    </div>
  );
}
