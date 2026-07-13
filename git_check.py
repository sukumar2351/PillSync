import subprocess
import sys
import os

# Set console colors
COLOR_RESET = "\033[0m"
COLOR_BOLD = "\033[1m"
COLOR_RED = "\033[31m"
COLOR_GREEN = "\033[32m"
COLOR_YELLOW = "\033[33m"
COLOR_BLUE = "\033[34m"
COLOR_CYAN = "\033[36m"

def run_git(cmd):
    try:
        result = subprocess.run(
            ["git"] + cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return ""

def main():
    print(f"{COLOR_BOLD}{COLOR_YELLOW}======================================================={COLOR_RESET}")
    print(f"{COLOR_BOLD}{COLOR_YELLOW}  PILLSYNC - Git Repository Synchrony and Status Check {COLOR_RESET}")
    print(f"{COLOR_BOLD}{COLOR_YELLOW}======================================================={COLOR_RESET}\n")

    # 1. Fetch latest remote information
    print("[*] Fetching latest remote status...")
    try:
        subprocess.run(["git", "fetch", "--quiet", "origin"], check=True)
    except subprocess.CalledProcessError:
        print(f"{COLOR_RED}[!] Warning: Failed to contact remote origin. Working in offline mode.{COLOR_RESET}\n")

    # 2. Check for local uncommitted changes
    uncommitted = run_git(["status", "--porcelain", "-uno"])
    if uncommitted:
        print(f"{COLOR_RED}[ALERT] You have uncommitted changes in your local workspace (tracked files):{COLOR_RESET}")
        print(run_git(["status", "-s", "-uno"]))
        print(f"\n{COLOR_YELLOW}[SUGGESTION] Please commit or stash these changes before switching branches,")
        print(f"             pulling updates, or starting new work.{COLOR_RESET}\n")
        print("=======================================================")
        input("Press Enter to exit...")
        sys.exit(1)

    # 3. Identify current branch
    current_branch = run_git(["branch", "--show-current"])
    if not current_branch:
        current_branch = "detached_head"
    print(f"[*] Active local branch: {COLOR_BOLD}{current_branch}{COLOR_RESET}")

    # 4. Compare main vs origin/main
    print("[*] Comparing Local 'main' vs Remote 'origin/main'...")
    local_main = run_git(["rev-parse", "--verify", "main"])
    remote_main = run_git(["rev-parse", "--verify", "origin/main"])

    if not local_main:
        print(f"{COLOR_RED}[!] Local 'main' branch not found.{COLOR_RESET}")
        sys.exit(1)
    if not remote_main:
        print(f"{COLOR_YELLOW}[!] Remote 'origin/main' branch not found.{COLOR_RESET}")
    else:
        diff_str = run_git(["rev-list", "--left-right", "--count", "main...origin/main"])
        if diff_str:
            ahead, behind = map(int, diff_str.split())
            if ahead == 0 and behind == 0:
                print(f"{COLOR_GREEN}[OK] Local 'main' and 'origin/main' are fully synchronized.{COLOR_RESET}")
            elif ahead > 0 and behind == 0:
                print(f"{COLOR_BLUE}[ALERT] Local 'main' is ahead of 'origin/main' by {ahead} commit(s).{COLOR_RESET}")
                print(f"{COLOR_CYAN}[SUGGESTION] Run: git push origin main{COLOR_RESET}")
            elif ahead == 0 and behind > 0:
                print(f"{COLOR_RED}[ALERT] Remote 'origin/main' has {behind} new change(s) not in your local branch.{COLOR_RESET}")
                print(f"{COLOR_CYAN}[SUGGESTION] Run: git pull origin main{COLOR_RESET}")
            else:
                print(f"{COLOR_RED}[ALERT] Local 'main' and 'origin/main' have diverged (Ahead {ahead}, Behind {behind}).{COLOR_RESET}")
                print(f"{COLOR_CYAN}[SUGGESTION] Please review changes or perform a merge.{COLOR_RESET}")
    print("")

    # 5. Check active milestone branch sync
    if current_branch.startswith("milestone-"):
        print(f"[*] Checking sync status for active milestone branch: {current_branch}...")
        remote_ms = run_git(["rev-parse", "--verify", f"origin/{current_branch}"])
        if not remote_ms:
            print(f"{COLOR_YELLOW}[!] Remote counterpart 'origin/{current_branch}' not found.{COLOR_RESET}")
        else:
            diff_str = run_git(["rev-list", "--left-right", "--count", f"{current_branch}...origin/{current_branch}"])
            if diff_str:
                ahead, behind = map(int, diff_str.split())
                if ahead == 0 and behind == 0:
                    print(f"{COLOR_GREEN}[OK] Branch '{current_branch}' is up to date with remote.{COLOR_RESET}")
                elif ahead > 0 and behind == 0:
                    print(f"{COLOR_BLUE}[ALERT] Local branch '{current_branch}' is ahead of remote by {ahead} commit(s).{COLOR_RESET}")
                    print(f"{COLOR_CYAN}[SUGGESTION] Run: git push origin {current_branch}{COLOR_RESET}")
                elif ahead == 0 and behind > 0:
                    print(f"{COLOR_RED}[ALERT] Remote 'origin/{current_branch}' has {behind} new change(s).{COLOR_RESET}")
                    print(f"{COLOR_CYAN}[SUGGESTION] Run: git pull origin {current_branch}{COLOR_RESET}")
        print("")

    print("=======================================================")
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
