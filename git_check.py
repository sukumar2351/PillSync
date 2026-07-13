import subprocess
import sys

# Set console colors (compatible with Windows CMD and PowerShell)
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
    except subprocess.CalledProcessError:
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

    # 2. Check for uncommitted changes
    uncommitted = run_git(["status", "--porcelain"])
    
    # 3. Identify current branch
    current_branch = run_git(["branch", "--show-current"])
    if not current_branch:
        current_branch = "detached_head"
    print(f"[*] Active local branch: {COLOR_BOLD}{current_branch}{COLOR_RESET}")

    # 4. Compare Local main vs Remote origin/main
    local_main = run_git(["rev-parse", "--verify", "main"])
    remote_main = run_git(["rev-parse", "--verify", "origin/main"])

    print("\n--- STATUS CHECKLIST ---")

    has_errors = False

    # Check uncommitted status
    if uncommitted:
        print(f"{COLOR_RED}[WARN] Uncommitted changes detected.{COLOR_RESET}")
        print(f"       Please commit or stash these changes before switching branches,")
        print(f"       pulling updates, or starting new work.")
        print(run_git(["status", "-s"]))
        has_errors = True
    else:
        print(f"{COLOR_GREEN}[OK] Working tree is clean.{COLOR_RESET}")

    if not local_main:
        print(f"{COLOR_RED}[WARN] Local 'main' branch not found.{COLOR_RESET}")
        has_errors = True
    elif not remote_main:
        print(f"{COLOR_YELLOW}[WARN] Remote 'origin/main' branch not found.{COLOR_RESET}")
        has_errors = True
    else:
        diff_str = run_git(["rev-list", "--left-right", "--count", "main...origin/main"])
        if diff_str:
            ahead, behind = map(int, diff_str.split())
            if ahead == 0 and behind == 0:
                print(f"{COLOR_GREEN}[OK] Local Main Branch is up to date.{COLOR_RESET}")
                print(f"{COLOR_GREEN}[OK] Remote Main Branch is synchronized.{COLOR_RESET}")
            elif ahead > 0 and behind == 0:
                print(f"{COLOR_YELLOW}[WARN] Local has unpushed commits.{COLOR_RESET}")
                print(f"       Run: git push origin main")
                has_errors = True
            elif ahead == 0 and behind > 0:
                print(f"{COLOR_RED}[WARN] Remote has new changes.{COLOR_RESET}")
                print(f"       Run: git pull origin main")
                has_errors = True
            else:
                print(f"{COLOR_RED}[WARN] Local and Remote Main branches have diverged (Ahead {ahead}, Behind {behind}).{COLOR_RESET}")
                print(f"       Please merge or rebase to synchronize.")
                has_errors = True

    print("------------------------\n")

    if has_errors:
        print(f"{COLOR_BOLD}{COLOR_RED}[WARN] Action Required: Please resolve the warnings above before coding.{COLOR_RESET}")
    else:
        print(f"{COLOR_BOLD}{COLOR_GREEN}[OK] Repository is synchronized and ready for development.{COLOR_RESET}")

    print("\n=======================================================")
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
