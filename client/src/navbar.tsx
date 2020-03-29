import { AppBar, Icon, IconButton, Toolbar } from "@material-ui/core";
import Link from "@material-ui/core/Link";
import { makeStyles } from "@material-ui/core/styles";
import GitHubIcon from "@material-ui/icons/GitHub";
import LooksIcon from "@material-ui/icons/Looks";
import React from "react";

const navbarStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  titleLink: {
    color: theme.palette.primary.contrastText,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
}));

export function Navbar() {
  const classes = navbarStyles();

  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <Icon className={classes.menuButton}>
          <Link
            href={process.env.PUBLIC_URL}
            underline="none"
            className={classes.titleLink}
          >
            <LooksIcon />
          </Link>
        </Icon>
        <Link
          href="/"
          underline="none"
          variant="h6"
          className={classes.titleLink}
        >
          Rainbow Options Calculator
        </Link>
        <div style={{ flexGrow: 1 }} />
        <div>
          <IconButton
            aria-label="link to github"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            color="inherit"
          >
            <Link
              href="https://github.com/advait/rainbow-options"
              className={classes.titleLink}
              target="_blank"
            >
              <GitHubIcon />
            </Link>
          </IconButton>
        </div>
      </Toolbar>
    </AppBar>
  );
}
