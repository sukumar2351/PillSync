import subprocess
import sys
import os

# Configure stdout to support UTF-8 encoding on Windows terminals to prevent crashes with Unicode characters
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

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
    except subprocess.CalledProcessError:
        return ""

def handle_uncommitted():
    print(f"{COLOR_YELLOW}[WARN] Uncommitted changes detected in your workspace.{COLOR_RESET}")
    print("Modified files:")
    print(run_git(["status", "-s"]))
    print("\nHow would you like to resolve these changes?")
    print(f"  {COLOR_BOLD}a){COLOR_RESET} Commit the changes automatically.")
    print(f"  {COLOR_BOLD}b){COLOR_RESET} Stash the changes.")
    print(f"  {COLOR_BOLD}c){COLOR_RESET} Discard the changes.")
    print(f"  {COLOR_BOLD}d){COLOR_RESET} Do nothing (keep them).")
    choice = input("Select an option (a/b/c/d): ").strip().lower()
    
    if choice == 'a':
        msg = input("Enter commit message [temp: auto commit before sync]: ").strip()
        if not msg:
            msg = "temp: auto commit before sync"
        run_git(["add", "."])
        res = run_git(["commit", "-m", msg])
        print(f"{COLOR_GREEN}[OK] Changes committed successfully.{COLOR_RESET}")
    elif choice == 'b':
        run_git(["stash"])
        print(f"{COLOR_GREEN}[OK] Changes stashed successfully.{COLOR_RESET}")
    elif choice == 'c':
        confirm = input(f"{COLOR_RED}Are you sure you want to discard all local changes? This cannot be undone! (y/n): {COLOR_RESET}").strip().lower()
        if confirm == 'y':
            run_git(["reset", "--hard", "HEAD"])
            run_git(["clean", "-fd"])
            print(f"{COLOR_GREEN}[OK] Local changes discarded.{COLOR_RESET}")
        else:
            print(f"{COLOR_YELLOW}[INFO] Discard cancelled.{COLOR_RESET}")
    else:
        print(f"{COLOR_YELLOW}[INFO] Changes kept. Note that pulling or merging may fail due to conflicts.{COLOR_RESET}")

def sync_branches(current_branch):
    print(f"\n[*] Fetching latest remote commits...")
    run_git(["fetch", "origin"])

    # If on a milestone branch, update main first, then integrate
    if current_branch.startswith("milestone-"):
        print(f"[*] You are on milestone branch: {COLOR_BOLD}{current_branch}{COLOR_RESET}")
        print(f"[*] Synchronizing local 'main' branch with 'origin/main' first...")
        
        # Save current branch
        original_branch = current_branch
        
        # Switch to main
        run_git(["checkout", "main"])
        
        # Attempt to pull main
        pull_res = subprocess.run(["git", "pull", "origin", "main"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if pull_res.returncode != 0:
            conflicted = run_git(["diff", "--name-only", "--diff-filter=U"])
            if conflicted:
                print(f"{COLOR_RED}[ERROR] Merge conflicts detected on 'main' branch:{COLOR_RESET}")
                print(conflicted)
                run_git(["merge", "--abort"])
                print(f"{COLOR_YELLOW}[INFO] Merge aborted. Please resolve conflicts manually.{COLOR_RESET}")
            else:
                print(f"{COLOR_RED}[ERROR] Failed to pull main branch. Aborting.{COLOR_RESET}")
            # Switch back
            run_git(["checkout", original_branch])
            return False
            
        # Switch back to milestone branch
        run_git(["checkout", original_branch])
        
        # Ask to merge or rebase
        print(f"\nWould you like to integrate the updated 'main' branch into your active branch '{original_branch}'?")
        print(f"  {COLOR_BOLD}a){COLOR_RESET} Merge 'main' into '{original_branch}'")
        print(f"  {COLOR_BOLD}b){COLOR_RESET} Rebase '{original_branch}' on top of 'main'")
        print(f"  {COLOR_BOLD}c){COLOR_RESET} Skip integration for now")
        choice = input("Select an option (a/b/c): ").strip().lower()
        
        if choice == 'a':
            print(f"[*] Merging 'main' into '{original_branch}'...")
            res = subprocess.run(["git", "merge", "main"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode != 0:
                conflicted = run_git(["diff", "--name-only", "--diff-filter=U"])
                print(f"{COLOR_RED}[ERROR] Merge conflicts detected during integration:{COLOR_RESET}")
                print(conflicted)
                run_git(["merge", "--abort"])
                print(f"{COLOR_YELLOW}[INFO] Merge aborted. Please resolve conflicts manually.{COLOR_RESET}")
                return False
            else:
                print(f"{COLOR_GREEN}[OK] Successfully merged 'main' into '{original_branch}'.{COLOR_RESET}")
        elif choice == 'b':
            print(f"[*] Rebasing '{original_branch}' on 'main'...")
            res = subprocess.run(["git", "rebase", "main"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode != 0:
                conflicted = run_git(["diff", "--name-only", "--diff-filter=U"])
                print(f"{COLOR_RED}[ERROR] Rebase conflicts detected during integration:{COLOR_RESET}")
                print(conflicted)
                run_git(["rebase", "--abort"])
                print(f"{COLOR_YELLOW}[INFO] Rebase aborted. Please resolve conflicts manually.{COLOR_RESET}")
                return False
            else:
                print(f"{COLOR_GREEN}[OK] Successfully rebased '{original_branch}' on 'main'.{COLOR_RESET}")
        else:
            print(f"{COLOR_YELLOW}[INFO] Integration skipped.{COLOR_RESET}")
    else:
        # We are on main branch directly
        print(f"[*] Pulling latest commits for local 'main' branch...")
        pull_res = subprocess.run(["git", "pull", "origin", "main"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if pull_res.returncode != 0:
            conflicted = run_git(["diff", "--name-only", "--diff-filter=U"])
            if conflicted:
                print(f"{COLOR_RED}[ERROR] Merge conflicts detected on 'main' branch:{COLOR_RESET}")
                print(conflicted)
                run_git(["merge", "--abort"])
                print(f"{COLOR_YELLOW}[INFO] Pull aborted. Please resolve conflicts manually.{COLOR_RESET}")
            else:
                print(f"{COLOR_RED}[ERROR] Failed to pull main branch.{COLOR_RESET}")
            return False
            
    return True

def show_status(current_branch):
    print(f"\n{COLOR_BOLD}=== FINAL SYNCHRONIZATION STATUS ==={COLOR_RESET}")
    
    uncommitted = run_git(["status", "--porcelain"])
    local_main = run_git(["rev-parse", "--verify", "main"])
    remote_main = run_git(["rev-parse", "--verify", "origin/main"])

    has_warnings = False

    # 1. Uncommitted check
    if uncommitted:
        print(f"{COLOR_YELLOW}⚠ Uncommitted changes detected.{COLOR_RESET}")
        has_warnings = True
    else:
        print(f"{COLOR_GREEN}✓ Working tree is clean.{COLOR_RESET}")

    # 2. Main branch status
    if not local_main:
        print(f"{COLOR_RED}⚠ Local 'main' branch not found.{COLOR_RESET}")
        has_warnings = True
    elif not remote_main:
        print(f"{COLOR_YELLOW}⚠ Remote 'origin/main' branch not found.{COLOR_RESET}")
        has_warnings = True
    else:
        diff_str = run_git(["rev-list", "--left-right", "--count", "main...origin/main"])
        if diff_str:
            ahead, behind = map(int, diff_str.split())
            if ahead == 0 and behind == 0:
                print(f"{COLOR_GREEN}✓ Local Main Branch is up to date.{COLOR_RESET}")
                print(f"{COLOR_GREEN}✓ Remote Main Branch is synchronized.{COLOR_RESET}")
            elif ahead > 0:
                print(f"{COLOR_YELLOW}⚠ Local has unpushed commits.{COLOR_RESET}")
                print(f"  Run: git push origin main")
                has_warnings = True
            elif behind > 0:
                print(f"{COLOR_RED}⚠ Remote has new changes.{COLOR_RESET}")
                print(f"  Run: git pull origin main")
                has_warnings = True

    # 3. Active branch sync status (if milestone)
    if current_branch.startswith("milestone-"):
        remote_ms = run_git(["rev-parse", "--verify", f"origin/{current_branch}"])
        if remote_ms:
            diff_str = run_git(["rev-list", "--left-right", "--count", f"{current_branch}...origin/{current_branch}"])
            if diff_str:
                ahead, behind = map(int, diff_str.split())
                if ahead == 0 and behind == 0:
                    print(f"{COLOR_GREEN}✓ Branch '{current_branch}' is up to date with remote.{COLOR_RESET}")
                elif ahead > 0:
                    print(f"{COLOR_YELLOW}⚠ Branch '{current_branch}' is ahead of remote by {ahead} commit(s).{COLOR_RESET}")
                    print(f"  Run: git push origin {current_branch}")
                    has_warnings = True
                elif behind > 0:
                    print(f"{COLOR_RED}⚠ Branch '{current_branch}' has {behind} unpulled remote changes.{COLOR_RESET}")
                    print(f"  Run: git pull origin {current_branch}")
                    has_warnings = True

    print("------------------------------------\n")

    if not has_warnings:
        print(f"{COLOR_BOLD}{COLOR_GREEN}✓ Repository is synchronized.{COLOR_RESET}")
        print(f"{COLOR_BOLD}{COLOR_GREEN}✓ Local and Remote branches are up to date.{COLOR_RESET}")
        print(f"{COLOR_BOLD}{COLOR_GREEN}✓ Safe to begin development.{COLOR_RESET}")
    else:
        print(f"{COLOR_BOLD}{COLOR_YELLOW}⚠ Status: Resolved actions, but some push/pull steps remain manual.{COLOR_RESET}")

def main():
    print(f"{COLOR_BOLD}{COLOR_YELLOW}======================================================={COLOR_RESET}")
    print(f"{COLOR_BOLD}{COLOR_YELLOW}  PILLSYNC - Git Repository Synchrony and Status Check {COLOR_RESET}")
    print(f"{COLOR_BOLD}{COLOR_YELLOW}======================================================={COLOR_RESET}\n")

    # Check uncommitted first
    uncommitted = run_git(["status", "--porcelain"])
    if uncommitted:
        handle_uncommitted()

    # Identify current branch
    current_branch = run_git(["branch", "--show-current"])
    if not current_branch:
        current_branch = "detached_head"
    print(f"\n[*] Active local branch: {COLOR_BOLD}{current_branch}{COLOR_RESET}")

    # Synchronize branches
    sync_branches(current_branch)

    # Show final status
    show_status(current_branch)

    print("\n=======================================================")
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
