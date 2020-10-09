from bs4 import BeautifulSoup
import requests as req
import os
import csv

def get_stability(turn, fade):
    # Stability is determined by Turn + Fade
    # Very Overstable: 7.5 - 4.0
    # Overstable: 3.5 - 0.5
    # Neutral: 0
    # Understable: -0.5 - -2.5
    # Very Understable: -3.0 - -5.5

    stabilityRating = round(float(turn)) + round(float(fade))

    if stabilityRating >= 4.0:
        return "Very Overstable"
    if stabilityRating <= 3.5 and stabilityRating >= 0.5:
        return "Overstable"
    if stabilityRating == 0:
        return "Neutral"
    if stabilityRating <= -0.5 and stabilityRating >= -2.5:
        return "Understable"
    if stabilityRating <= -3.0:
        return "Very Understable"
    return "Other"

url = "https://infinitediscs.com"
brands = {}

source_home = req.get(url).text

soup = BeautifulSoup(source_home, 'lxml')

for category_links in soup.find('div', id='main-menu').find_all('li'):

    if category_links.a != None and '/category' in category_links.a['href']:
        if category_links.a.text not in brands.keys():
            brands[category_links.a.text] = category_links.a['href']

with open(os.path.join("..", "Resources", "Discs.csv"), 'w') as csvfile:

    csvwriter = csv.writer(csvfile, delimiter=',')

    csvwriter.writerow(["Name", "Brand", "Category", "Stability", "Speed", "Glide", "Turn", "Fade", "URL", "ImageURL"])

    for brand in brands:
        source_brand = req.get(f'{url}{brands[brand]}').text
        soup = BeautifulSoup(source_brand, 'lxml')

        for category in soup.find_all('div', class_='category-wrapper'):
            category_name = category.h3.text

            for disc in category.find_all('div', class_='thumbnail'):
                disc_name = str(disc.h4.text).strip()
                disc_flight_stats = str(disc.small.text).strip().split('/')
                disc_speed = disc_flight_stats[0]
                disc_glide = disc_flight_stats[1]
                disc_turn = disc_flight_stats[2]
                disc_fade = disc_flight_stats[3]
                disc_image = str(disc.img['src']).strip()
                disc_url = disc.find("button", class_="btn-default")['onclick'].split('=')[1].replace("'", "")

                csvwriter.writerow([disc_name, brand, category_name, get_stability(disc_turn, disc_fade), disc_speed, disc_glide, disc_turn, disc_fade, f"{url}{disc_url}", disc_image])
