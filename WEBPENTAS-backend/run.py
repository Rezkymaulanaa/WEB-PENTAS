import os

from app import create_app

app = create_app()

if __name__ == '__main__':
    # Mode debug hanya untuk development; set FLASK_DEBUG=0 di .env saat dipakai sungguhan.
    app.run(debug=os.getenv('FLASK_DEBUG', '1') == '1')
