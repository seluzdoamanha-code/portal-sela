import sys
import subprocess

try:
    with open('m_ass_familias.js', 'r') as f:
        code = f.read()
    print("Read JS.")
except Exception as e:
    print(e)
