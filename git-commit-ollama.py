#!/usr/bin/env python3

import subprocess
import sys
import shlex
import time

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

def generate_commit_message(diff, attempt=1):
    """Call ollama to generate a commit message. Returns message or None."""
    # Stricter prompt on later attempts
    if attempt > 1:
        prompt = (f"Generate a VERY SHORT git commit message (maximum 200 characters, ideally under 150). "
                  f"Do not exceed 200 characters. Summarize:\n\n{diff}")
    else:
        prompt = f"Generate a concise git commit message (maximum 200 characters) summarizing the following changes:\n\n{diff}"
    
    # Escape for shell
    safe_prompt = shlex.quote(prompt)
    cmd = f'ollama run tinyllama {safe_prompt}'
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        msg = result.stdout.strip().strip('"')
        # Take first line only
        msg = msg.split('\n')[0].strip()
        return msg
    except subprocess.CalledProcessError:
        return None

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

    # 2. Generate commit message with retry on length > 200
    commit_msg = None
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        print(f"Generating commit message (attempt {attempt}/{max_attempts})...")
        commit_msg = generate_commit_message(diff, attempt)
        if commit_msg and len(commit_msg) <= 200:
            print(f"Valid message ({len(commit_msg)} chars): {commit_msg}")
            break
        elif commit_msg:
            print(f"Message too long ({len(commit_msg)} chars). Retrying...")
        else:
            print("Failed to get message from ollama. Retrying...")
        time.sleep(1)  # brief pause before retry

    if not commit_msg or len(commit_msg) > 200:
        print(f"Failed to generate a commit message <=200 chars after {max_attempts} attempts. Aborting.", file=sys.stderr)
        sys.exit(1)

    # 3. Add all changes
    try:
        run_cmd("git add -A", capture_output=False)
    except subprocess.CalledProcessError as e:
        print(f"git add failed: {e}", file=sys.stderr)
        sys.exit(1)

    # 4. Commit
    try:
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