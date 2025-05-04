import os

def consolidate_webapp_files(folders, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for folder in folders:
            if folder == r"K:\meals.stellation.one":
                files = [f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
                for filename in files:
                    filepath = os.path.join(folder, filename)
                    header = f"\n{'='*20} {filename} {'='*20}\n\n"
                    outfile.write(header)

                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except UnicodeDecodeError:
                        outfile.write("[Binary or non-text file skipped]\n")
                    outfile.write('\n')
            else:
                for root, _, files in os.walk(folder):
                    for filename in files:
                        filepath = os.path.join(root, filename)
                        header = f"\n{'='*20} {os.path.relpath(filepath, folder)} {'='*20}\n\n"
                        outfile.write(header)

                        try:
                            with open(filepath, 'r', encoding='utf-8') as infile:
                                outfile.write(infile.read())
                        except UnicodeDecodeError:
                            outfile.write("[Binary or non-text file skipped]\n")
                        outfile.write('\n')

# Folders to consolidate
folders_to_process = [
    r"K:\meals.stellation.one",
    r"K:\meals.stellation.one\css",
    r"K:\meals.stellation.one\js",
    r"K:\meals.stellation.one\scripts",
    r"K:\meals.stellation.one\recipes"
]

# Output file
output_path = r"K:\meals.stellation.one\consolidated_webapp.txt"

consolidate_webapp_files(folders_to_process, output_path)
