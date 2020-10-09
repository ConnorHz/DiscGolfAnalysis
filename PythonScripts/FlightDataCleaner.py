import os
import pandas as pd

path = os.path.join('..', 'Resources', 'PopularBrandFlightData.csv')

df_discs = pd.read_csv(path)

# Split Flight Rating into the 4 stats
df_discs[['Speed', 'Glide', 'Turn', 'Fade']] = df_discs["Flight Rating"].str.split('/', expand=True)

# Remove the Flight Rating Column
df_discs = df_discs.drop(columns=['Flight Rating'])


print(df_discs.head(10))
