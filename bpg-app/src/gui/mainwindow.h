#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QImage>
#include <QPixmap>
#include "bpg_wrapper.h"
#include "encoder_wrapper.h"

QT_BEGIN_NAMESPACE
namespace Ui { class MainWindow; }
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void on_openButton_clicked();
    void on_encodeButton_clicked();
    void on_decodeButton_clicked();

private:
    Ui::MainWindow *ui;
    BPGWrapper bpgWrapper;
    EncoderWrapper encoderWrapper;
    QImage currentImage;
    QString currentFilename;
    void displayImage(const QImage& image);
};
#endif // MAINWINDOW_H
