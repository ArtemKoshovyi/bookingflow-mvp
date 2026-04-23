using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookingApp.Migrations
{
    /// <inheritdoc />
    public partial class AddBusiness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BusinessId",
                table: "Workers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BusinessId",
                table: "Services",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BusinessId",
                table: "Bookings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Businesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Businesses", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Workers_BusinessId",
                table: "Workers",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_Services_BusinessId",
                table: "Services",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BusinessId",
                table: "Bookings",
                column: "BusinessId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Businesses_BusinessId",
                table: "Bookings",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Services_Businesses_BusinessId",
                table: "Services",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Workers_Businesses_BusinessId",
                table: "Workers",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Businesses_BusinessId",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_Businesses_BusinessId",
                table: "Services");

            migrationBuilder.DropForeignKey(
                name: "FK_Workers_Businesses_BusinessId",
                table: "Workers");

            migrationBuilder.DropTable(
                name: "Businesses");

            migrationBuilder.DropIndex(
                name: "IX_Workers_BusinessId",
                table: "Workers");

            migrationBuilder.DropIndex(
                name: "IX_Services_BusinessId",
                table: "Services");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_BusinessId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "BusinessId",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "BusinessId",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "BusinessId",
                table: "Bookings");
        }
    }
}
