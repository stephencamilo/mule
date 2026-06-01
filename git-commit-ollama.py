#!/usr/bin/env python3

import subprocess
import sys
import shlex

def run_cmd(cmd, capture_output=True, check=True):
    """Run a shell command and return stdout (stripped)."""
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=capture_output,
        text=True,
        check=check
    )
    return result.stdout.strip() if capture_output else None

def main():
    # 1. Get git diff
    try:
        diff = run_cmd("git diff")
    except subprocess.CalledProcessError as e:
        print(f"Error running git diff: {e}", file=sys.stderr)
        sys.exit(1)

    if not diff:
        print("No changes to commit. Exiting.")
        sys.exit(0)

    # 2. Generate commit message via ollama
    print("Generating commit message from diff...")
    # Escape double quotes and backslashes for safe shell argument
    safe_diff = diff.replace('\\', '\\\\').replace('"', '\\"')
    prompt = f'Generate a concise git commit message (maximum 200 characters) summarizing the following changes:\n\n{safe_diff}'
    # Use shlex.quote to safely pass the prompt as a single argument
    cmd = f'ollama run tinyllama {shlex.quote(prompt)}'
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        commit_msg = result.stdout.strip().strip('"')
        # Take only first line in case the model outputs more
        commit_msg = commit_msg.split('\n')[0]
    except subprocess.CalledProcessError as e:
        print(f"Ollama failed: {e}", file=sys.stderr)
        sys.exit(1)

    if not commit_msg:
        print("Failed to generate a commit message. Aborting.", file=sys.stderr)
        sys.exit(1)

    print(f"Generated message: {commit_msg}")

    # 3. Add all changes
    try:
        run_cmd("git add -A", capture_output=False)
    except subprocess.CalledProcessError as e:
        print(f"git add failed: {e}", file=sys.stderr)
        sys.exit(1)

    # 4. Commit
    try:
        # Use -m with the message; ensure proper quoting
        run_cmd(f'git commit -m {shlex.quote(commit_msg)}', capture_output=False)
    except subprocess.CalledProcessError as e:
        print(f"git commit failed: {e}", file=sys.stderr)
        sys.exit(1)

    # 5. Push to current branch
    try:
        current_branch = run_cmd("git rev-parse --abbrev-ref HEAD")
        run_cmd(f"git push origin {shlex.quote(current_branch)}", capture_output=False)
    except subprocess.CalledProcessError as e:
        print(f"git push failed: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Done! Pushed to {current_branch}.")

if __name__ == "__main__":
    main()