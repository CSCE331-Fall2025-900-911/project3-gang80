# Global variables for the Flask backend
import os

# Organization / OAuth client ID used for token verification
ORG_ID = "1090847452683-mc60dh5mdhlj90i1qathlqovdc3bhj2d.apps.googleusercontent.com"

# Google Translate API Key (read from environment variable for security)
# Do NOT hard-code the key here. Set an environment variable named TRANSLATE_API_KEY
# or create a local .env (loaded by app.py) with TRANSLATE_API_KEY=<your_key>.
TRANSLATE_API_KEY = os.environ.get("TRANSLATE_API_KEY")
# Fallback: allow a local plaintext file at repository root or backend folder named
# `translate_key.txt` for users who prefer storing the key in a separate file.
# The file may contain either just the key or a line like: TRANSLATE_API_KEY = "KEY"
if not TRANSLATE_API_KEY:
	possible_paths = [
		os.path.join(os.path.dirname(__file__), '..', 'translate_key.txt'),
		os.path.join(os.path.dirname(__file__), 'translate_key.txt'),
		os.path.join(os.path.dirname(__file__), '..', '..', 'translate_key.txt'),
	]
	for p in possible_paths:
		try:
			p = os.path.abspath(p)
			if os.path.exists(p):
				with open(p, 'r', encoding='utf-8') as fh:
					content = fh.read().strip()
					# Try to extract a quoted value or an assignment
					if 'TRANSLATE_API_KEY' in content and '=' in content:
						# e.g. TRANSLATE_API_KEY = "KEY"
						parts = content.split('=', 1)[1].strip()
						# remove quotes and whitespace
						parts = parts.strip().strip('"').strip("'")
						TRANSLATE_API_KEY = parts
						break
					else:
						# assume the file contains only the key
						TRANSLATE_API_KEY = content.strip().strip('"').strip("'")
						break
		except Exception:
			# ignore parse/read errors and continue
			continue


def _load_superuser_emails():
	"""Load superuser emails from `superuser_emails.txt` placed next to this file.

	Each non-empty line (comments starting with # are ignored) becomes one email entry.
	Returns an empty set if the file is missing or unreadable.
	"""
	path = os.path.join(os.path.dirname(__file__), "superuser_emails.txt")
	try:
		with open(path, "r", encoding="utf-8") as fh:
			emails = set()
			for raw in fh:
				line = raw.strip()
				if not line:
					continue
				if line.startswith("#"):
					continue
				emails.add(line)
			return emails
	except Exception:
		# If the file is not present or cannot be read, return an empty set.
		print("Error Parsing superuser_emails.txt")
		return set()


SUPERUSER_EMAILS = _load_superuser_emails()