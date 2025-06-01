#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QFileDialog>
#include <QMessageBox>
#include <QPixmap>
#include <QImage>
#include <iostream>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::on_openButton_clicked()
{
    QString filename = QFileDialog::getOpenFileName(this, "Open Image", "", "Image Files (*.png *.jpg *.jpeg *.bpg)");
    if (!filename.isEmpty()) {
        currentFilename = filename;
        if (filename.endsWith(".bpg", Qt::CaseInsensitive)) {
            on_decodeButton_clicked();
        } else {
            currentImage.load(filename);
            displayImage(currentImage);
        }
    }
}

void MainWindow::on_encodeButton_clicked()
{
    if (currentFilename.isEmpty()) {
        QMessageBox::warning(this, "Error", "No image loaded.");
        return;
    }

    QString outputFilename = QFileDialog::getSaveFileName(this, "Save BPG Image", "", "BPG Images (*.bpg)");
    if (!outputFilename.isEmpty()) {
        if (encoderWrapper.encodeBPG(currentFilename.toUtf8().data(), outputFilename.toUtf8().data(), "-q 30")) {
            QMessageBox::information(this, "Success", "Image encoded successfully.");
        } else {
            QMessageBox::critical(this, "Error", "Failed to encode image.");
        }
    }
}

void MainWindow::on_decodeButton_clicked()
{
    if (currentFilename.isEmpty() || !currentFilename.endsWith(".bpg", Qt::CaseInsensitive)) {
        QMessageBox::warning(this, "Error", "No BPG image loaded.");
        return;
    }

    unsigned char* buffer = nullptr;
    int width, height, channels;
    if (bpgWrapper.decodeBPG(currentFilename.toUtf8().data(), &buffer, &width, &height, &channels)) {
        QImage decodedImage(buffer, width, height, channels == 3 ? QImage::Format_RGB888 : QImage::Format_Grayscale8);
        displayImage(decodedImage);
        bpgWrapper.freeBuffer(buffer);
    } else {
        QMessageBox::critical(this, "Error", "Failed to decode BPG image.");
    }
}

void MainWindow::displayImage(const QImage& image) {
    if (!image.isNull()) {
        ui->imageLabel->setPixmap(QPixmap::fromImage(image).scaled(ui->imageLabel->size(), Qt::KeepAspectRatio));
    } else {
        QMessageBox::critical(this, "Error", "Failed to load image.");
    }
}
