import os
import pandas as pd

def get_disc_category(disc):
    return 0

def get_stability(disc):
    # Stability is determined by Turn + Fade
    # Very Overstable: 7.5 - 4.0
    # Overstable: 3.5 - 0.5
    # Neutral: 0
    # Understable: -0.5 - -2.5
    # Very Understable: -3.0 - -5.5

    stabilityRating = round(float(disc["Turn"])) + round(float(disc["Fade"]))

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

path = os.path.join('..', 'Resources', 'PopularBrandFlightData.csv')

df_discs = pd.read_csv(path)

# Split Flight Rating into the 4 stats
df_discs[['Speed', 'Glide', 'Turn', 'Fade']] = df_discs["Flight Rating"].str.split('/', expand=True)

# Remove the Flight Rating Column
df_discs = df_discs.drop(columns=['Flight Rating'])


df_discs["Stability"] = df_discs.apply(lambda row: get_stability(row), axis=1)


print(df_discs[df_discs['Name'] == 'Warship'].head(10))