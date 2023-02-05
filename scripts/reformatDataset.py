import pandas as pd
import sys
import json
import random
import re

input_csv = sys.argv[1]
output_jsonl = sys.argv[2]
input_data = pd.read_csv(input_csv)

def cleanup_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"@\S+", "", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\d/\d", "", text)

    return text

texts = []
# iterate pandas dataframe data
for index, row in input_data.sort_values('likes_count', ascending=False).iterrows():
    text = row["tweet"]
    if text.startswith("@"):
        continue
    text = cleanup_text(text)
    
    texts.append(text)

# Only use the top tweets
texts = texts[:200]

top_texts = texts[:25]
def generate_prompt(texts):
    return "The following is a list of example tweets written by the same author, each no longer than 280 characters:" + \
        "\n" + "\n###\n".join(texts) + "\n\nWrite a tweet in the same style, no longer than 280 characters:\n"

print(generate_prompt(top_texts[:20]))

def main():
    with open(output_jsonl, "w") as f:
        f.write('\n'.join([json.dumps({"prompt": generate_prompt(random.sample(top_texts, 8)), "completion": text + "\n######"}) for text in texts]))

if __name__ == "__main__":
    # main()
    pass