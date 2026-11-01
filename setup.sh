#!/bin/sh
# Installs the Meadow layout and its themes into the Herdr app on macOS and Linux.
#   sh setup.sh               install, check the mods and switch to Meadow
#   sh setup.sh --no-switch   install without switching
#   sh setup.sh --uninstall   remove it (a copy goes to the backups folder first)
set -eu

SRC=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SWITCH=1
UNINSTALL=0
for arg in "$@"; do
  case "$arg" in
    --no-switch) SWITCH=0 ;;
    --uninstall) UNINSTALL=1 ;;
    -h|--help) sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg (see --help)" >&2; exit 2 ;;
  esac
done

# The same lookup the app uses.
if [ -n "${HERDR_APP_HOME:-}" ]; then
  HOME_DIR=$HERDR_APP_HOME
elif [ -n "${XDG_CONFIG_HOME:-}" ]; then
  HOME_DIR=$XDG_CONFIG_HOME/herdr-app
else
  HOME_DIR=$HOME/.config/herdr-app
fi

APP=$(command -v herdr-app 2>/dev/null || true)
if [ -z "$APP" ] && [ -x "$HOME/.local/bin/herdr-app" ]; then APP=$HOME/.local/bin/herdr-app; fi

if [ ! -f "$HOME_DIR/AGENTS.md" ]; then
  echo "Note: $HOME_DIR doesn't look used yet. Open Herdr once if the layout doesn't appear."
fi

ITEMS="layouts/meadow.json layouts/meadow.svg themes/meadow-dark.json themes/meadow-light.json mods/meadow-field mods/meadow-spaces mods/meadow-agents"
BACKUP=$HOME_DIR/.meadow-backups/$(date +%Y%m%d-%H%M%S)

backup() {
  for item in $ITEMS; do
    if [ -e "$HOME_DIR/$item" ]; then
      mkdir -p "$BACKUP/$(dirname "$item")"
      cp -R "$HOME_DIR/$item" "$BACKUP/$item"
    fi
  done
  if [ -d "$BACKUP" ]; then echo "Backed up the previous copy to $BACKUP"; fi
}

if [ "$UNINSTALL" = 1 ]; then
  backup
  # Leave the layout first, so the window never shows one that's gone.
  if [ -n "$APP" ]; then HERDR_APP_HOME=$HOME_DIR "$APP" do layout.switch --name main >/dev/null 2>&1 || true; fi
  for item in $ITEMS; do rm -rf "${HOME_DIR:?}/$item"; done
  echo "Meadow removed from $HOME_DIR"
  exit 0
fi

backup
mkdir -p "$HOME_DIR/layouts" "$HOME_DIR/themes" "$HOME_DIR/mods"
for item in $ITEMS; do
  if [ -d "$SRC/$item" ]; then
    # Copied over the top: the window keeps running from these folders.
    mkdir -p "$HOME_DIR/$item"
    cp -R "$SRC/$item/." "$HOME_DIR/$item/"
  else
    cp "$SRC/$item" "$HOME_DIR/$item"
  fi
done
echo "Installed Meadow to $HOME_DIR"

if [ -z "$APP" ]; then
  echo "herdr-app isn't on PATH, so the mods weren't checked. Open Herdr, then pick Meadow in Settings > Look or press ctrl-shift-l."
  exit 0
fi

for mod in meadow-field meadow-spaces meadow-agents; do
  HERDR_APP_HOME=$HOME_DIR "$APP" check "$HOME_DIR/mods/$mod"
done

if [ "$SWITCH" = 1 ]; then
  if HERDR_APP_HOME=$HOME_DIR "$APP" do layout.switch --name meadow >/dev/null 2>&1; then
    echo "Switched to Meadow. It follows your light or dark appearance. ctrl-shift-l cycles back to your others."
  else
    echo "Herdr isn't open. Open it, then pick Meadow in Settings > Look or press ctrl-shift-l."
  fi
fi
