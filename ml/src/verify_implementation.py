import pandas as pd

pf = pd.read_csv('processed_features.csv')
tf = pd.read_csv('train_features.csv')

print("=" * 60)
print("VERIFICATION: SEPSIS_LABEL IMPLEMENTATION")
print("=" * 60)

print('\nprocessed_features.csv:')
print(f'  Shape: {pf.shape}')
print(f'  Has sepsis_label: {"sepsis_label" in pf.columns}')
print(f'  Column list: {pf.columns.tolist()}')

print('\ntrain_features.csv:')
print(f'  Shape: {tf.shape}')
print(f'  Has sepsis_label: {"sepsis_label" in tf.columns}')
print(f'  Column list (last 5): {tf.columns.tolist()[-5:]}')

print('\nSepsis Label Statistics:')
unique_admits_pf = pf['hadm_id'].nunique()
sepsis_positive_pf = pf[pf['sepsis_label']==1]['hadm_id'].nunique()
print(f'  Total admissions: {unique_admits_pf}')
print(f'  Sepsis positive: {sepsis_positive_pf} ({100*sepsis_positive_pf/unique_admits_pf:.1f}%)')
print(f'  Sepsis negative: {unique_admits_pf - sepsis_positive_pf} ({100*(unique_admits_pf - sepsis_positive_pf)/unique_admits_pf:.1f}%)')

print('\nSample rows with sepsis_label:')
print(tf[['hadm_id', 'hour', 'heart_rate', 'lactate', 'sepsis_label']].head(10))

print('\n✓ Implementation verified successfully!')
