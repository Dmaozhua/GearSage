import os
import csv
from openpyxl import load_workbook

# Paths
excel_file = r'rate\reel.xlsx'
webp_dir = r'rate\webp'

# Base URL
base_url = 'cloud://cloud1-1g9eeb3p33faac61.636c-cloud1-1g9eeb3p33faac61-1369414088/rate/reel/'
default_image = 'linshi.webp'

def update_excel():
    print(f"Loading workbook: {excel_file}")
    try:
        wb = load_workbook(excel_file)
        ws = wb.active # Assuming the data is in the first sheet
    except FileNotFoundError:
        print(f"Error: File {excel_file} not found.")
        return

    # Get max row
    max_row = ws.max_row
    print(f"Processing {max_row - 1} rows...")

    for row in range(2, max_row + 1):
        # Get ID from column A (column index 1)
        id_cell = ws.cell(row=row, column=1)
        id_val = id_cell.value
        
        if id_val is None:
            print(f"Row {row}: ID is empty, skipping.")
            continue

        # Handle potential float/int ID
        if isinstance(id_val, float) and id_val.is_integer():
            id_str = str(int(id_val))
        else:
            id_str = str(id_val)

        # Check if corresponding webp file exists
        webp_filename = f"{id_str}.webp"
        webp_path = os.path.join(os.getcwd(), 'rate', 'webp', webp_filename)
        
        target_value = ""
        
        # Construct base URL parts
        url_prefix = 'cloud://cloud1-1g9eeb3p33faac61.636c-cloud1-1g9eeb3p33faac61-1369414088/rate/reel/'
        
        if os.path.exists(webp_path):
            target_value = url_prefix + webp_filename
            print(f"Row {row}: Found {webp_filename} (ID: {id_str}), updating H{row}")
        else:
            target_value = url_prefix + default_image
            print(f"Row {row}: {webp_filename} (ID: {id_str}) not found, using default for H{row}")

        # Write to column H (column index 8)
        ws.cell(row=row, column=8).value = target_value

    print("Saving workbook...")
    wb.save(excel_file)
    print("Done!")

    # Convert to CSV
    csv_file = os.path.splitext(excel_file)[0] + '.csv'
    print(f"Converting to CSV: {csv_file}")
    
    with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        for row in ws.rows:
            writer.writerow([cell.value for cell in row])
    
    print("CSV conversion complete!")

if __name__ == "__main__":
    update_excel()
