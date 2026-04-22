try:
    import pymysql

    # Django's MySQL backend checks the MySQLdb version tuple even when
    # PyMySQL is acting as the adapter. Advertise a compatible version.
    pymysql.version_info = (2, 2, 1, "final", 0)
    pymysql.__version__ = "2.2.1"
    pymysql.install_as_MySQLdb()
except ImportError:
    # SQLite setups can run without PyMySQL installed.
    pass
