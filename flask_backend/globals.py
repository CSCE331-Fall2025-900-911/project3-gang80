# Global variables for the Flask backend
import os

# Organization / OAuth client ID used for token verification
ORG_ID = "1090847452683-mc60dh5mdhlj90i1qathlqovdc3bhj2d.apps.googleusercontent.com"


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