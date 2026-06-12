#!/usr/bin/env python3

import subprocess
import sys
import shlex
import time

def run_cmd(cmd, capture_output=True, check=True):
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=capture_output,
        text=True,
        check=check
    )
    return result.stdout.strip() if capture_output else None

def generate_commit_message(diff, attempt=1):
    if attempt > 1:
        prompt = (f"Generate a VERY SHORT git commit message (maximum 400 characters, ideally under 150). "
                  f"Do not exceed 400 characters. Summarize:\n\n{diff}")
    else:
        prompt = f"Generate a concise git commit message (maximum 400 characters) summarizing the following changes:\n\n{diff}"
    
    safe_prompt = shlex.quote(prompt)
    cmd = f'ollama run tinyllama {safe_prompt}'
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        msg = result.stdout.strip().strip('"')
        msg = msg.split('\n')[0].strip()
        return msg
    except subprocess.CalledProcessError:
        return None

def main():

    staged_diff = ""
    unstaged_diff = ""
    try:
        staged_diff = run_cmd("git diff --cached")
        unstaged_diff = run_cmd("git diff")
    except subprocess.CalledProcessError as e:
        print(f"Error running git diff: {e}", file=sys.stderr)
        sys.exit(1)

    use_staged = bool(staged_diff)
    diff = staged_diff if use_staged else unstaged_diff

    if not diff:
        print("No changes to commit (staged or unstaged). Exiting.")
        sys.exit(0)

    commit_msg = None
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        print(f"Generating commit message (attempt {attempt}/{max_attempts})...")
        commit_msg = generate_commit_message(diff, attempt)
        if commit_msg and len(commit_msg) <= 400:
            print(f"Valid message ({len(commit_msg)} chars): {commit_msg}")
            break
        elif commit_msg:
            print(f"Message too long ({len(commit_msg)} chars). Retrying...")
        else:
            print("Failed to get message from ollama. Retrying...")
        time.sleep(1)

    if not commit_msg or len(commit_msg) > 400:
        print(f"Failed to generate a commit message <=400 chars after {max_attempts} attempts. Aborting.", file=sys.stderr)
        sys.exit(1)

    if not use_staged:
        try:
            run_cmd("git add -A", capture_output=False)
        except subprocess.CalledProcessError as e:
            print(f"git add failed: {e}", file=sys.stderr)
            sys.exit(1)

    try:
        run_cmd(f'git commit -m {shlex.quote(commit_msg)}', capture_output=False)
    except subprocess.CalledProcessError as e:
        print(f"git commit failed: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        current_branch = run_cmd("git rev-parse --abbrev-ref HEAD")
        run_cmd(f"git push origin {shlex.quote(current_branch)}", capture_output=False)
    except subprocess.CalledProcessError as e:
        print(f"git push failed: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Done! Pushed to {current_branch}.")

if __name__ == "__main__":
    main()