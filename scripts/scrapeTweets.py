# From this guide: https://medium.com/@kevctae/twitter-scraping-without-using-twitter-api-2022-guide-39eaec7ccade
# pip install --upgrade git+https://github.com/kevctae/twint.git

import twint
import sys

username = sys.argv[1]
output_csv = sys.argv[2]

config = twint.Config()
config.Username = username
# config.Store_csv = True
config.Output = output_csv
config.Profile_full = True

twint.run.Profile(config)